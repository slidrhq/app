//! The eyedropper's screen, asked of Windows: every monitor copied at once, and the copy shown,
//! frozen, in a window over all of them, with a loupe at the pointer. A click takes the pixel
//! under it, as do Enter and Space; Esc, a right click or a switch to another app end it
//! with nothing. The arrow keys move the pointer by a pixel, with Shift by ten.
//!
//! The window lives on the main thread, in the event loop of the app's own windows, so its state
//! is the main thread's own. Calls into Win32 in windows-rs are `unsafe`; this file is one of the
//! places the app allows it.

use std::{cell::RefCell, ffi::c_void};

use windows::{
    Win32::{
        Foundation::{COLORREF, HINSTANCE, HWND, LPARAM, LRESULT, POINT, RECT, WPARAM},
        Graphics::{
            Dwm::{DWMWA_TRANSITIONS_FORCEDISABLED, DwmSetWindowAttribute},
            Gdi::{
                BeginPaint, BitBlt, CAPTUREBLT, CLEARTYPE_QUALITY, CLIP_DEFAULT_PRECIS,
                COLORONCOLOR, CreateCompatibleBitmap, CreateCompatibleDC, CreateFontW,
                CreateSolidBrush, DEFAULT_CHARSET, DT_LEFT, DT_NOPREFIX, DT_SINGLELINE, DT_VCENTER,
                DeleteDC, DeleteObject, DrawTextW, EndPaint, FW_SEMIBOLD, FillRect, FrameRect,
                GetDC, GetMonitorInfoW, GetPixel, HBITMAP, HBRUSH, HDC, HFONT, HGDIOBJ,
                InvalidateRect, MONITOR_DEFAULTTONEAREST, MONITORINFO, MonitorFromPoint,
                OUT_DEFAULT_PRECIS, PAINTSTRUCT, ReleaseDC, SRCCOPY, SelectObject, SetBkMode,
                SetStretchBltMode, SetTextColor, SetViewportOrgEx, StretchBlt, TRANSPARENT,
                UpdateWindow,
            },
        },
        System::LibraryLoader::GetModuleHandleW,
        UI::{
            HiDpi::GetDpiForWindow,
            Input::KeyboardAndMouse::{
                GetKeyState, ReleaseCapture, SetCapture, VIRTUAL_KEY, VK_DOWN, VK_ESCAPE, VK_LEFT,
                VK_RETURN, VK_RIGHT, VK_SHIFT, VK_SPACE, VK_UP,
            },
            WindowsAndMessaging::{
                CreateWindowExW, DefWindowProcW, DestroyWindow, GetCursorPos, GetSystemMetrics,
                IDC_CROSS, LoadCursorW, PostMessageW, RegisterClassExW, SM_CXVIRTUALSCREEN,
                SM_CYVIRTUALSCREEN, SM_XVIRTUALSCREEN, SM_YVIRTUALSCREEN, SW_SHOW, SetCursorPos,
                SetForegroundWindow, ShowWindow, WM_ACTIVATEAPP, WM_CLOSE, WM_DPICHANGED,
                WM_ERASEBKGND, WM_KEYDOWN, WM_LBUTTONDOWN, WM_LBUTTONUP, WM_MOUSEMOVE, WM_PAINT,
                WM_RBUTTONDOWN, WM_RBUTTONUP, WNDCLASSEXW, WS_EX_TOOLWINDOW, WS_EX_TOPMOST,
                WS_POPUP,
            },
        },
    },
    core::{BOOL, PCWSTR, w},
};

/// The colour picked, as red, green and blue; None when the user cancelled.
pub type Picked = Result<Option<[u8; 3]>, String>;
/// Called once, on the main thread, when the picker ends.
pub type Done = Box<dyn FnOnce(Picked)>;

const CLASS: PCWSTR = w!("SlidrScreenColor");
/// Pixels across the loupe: odd, so that one is in its middle.
const CELLS: i32 = 11;
/// GDI colours are 0x00bbggrr.
const PANEL: COLORREF = COLORREF(0x0024_2020);
const BLACK: COLORREF = COLORREF(0);
const WHITE: COLORREF = COLORREF(0x00ff_ffff);
const EDGE: COLORREF = COLORREF(0x0080_8080);

thread_local! {
    /// The picker that is open, if one is. Only the main thread has one.
    static PICKER: RefCell<Option<Picker>> = const { RefCell::new(None) };
}

/// Opens the picker over every screen; `done` gets its answer. One at a time: while one is open
/// it covers the screens, so a second is answered with nothing at once.
pub fn start(owner: Option<HWND>, done: Done) {
    if PICKER.with_borrow(Option::is_some) {
        return done(Ok(None));
    }
    let screen = match Snapshot::of_screens() {
        Ok(screen) => screen,
        Err(e) => return done(Err(e)),
    };
    let window = match create(owner, &screen) {
        Ok(window) => window,
        Err(e) => return done(Err(e)),
    };
    let scale = f64::from(unsafe { GetDpiForWindow(window) }.max(96)) / 96.0;
    let px = |n: f64| (n * scale).round() as i32;
    let mut at = POINT::default();
    let _ = unsafe { GetCursorPos(&raw mut at) };
    let mut picker = Picker {
        window,
        at: POINT {
            x: at.x - screen.left,
            y: at.y - screen.top,
        },
        screen,
        pressed: None,
        loupe: RECT::default(),
        cell: px(10.0),
        label: px(28.0),
        pad: px(4.0),
        gap: px(20.0),
        font: Font::new(px(13.0)),
        done,
    };
    picker.loupe = picker.place();
    PICKER.with_borrow_mut(|open| *open = Some(picker));
    // The window shows what the screens already show: without the fade of a new window, and
    // drawn at once, nothing is seen to change but the cursor and the loupe.
    let off = BOOL::from(true);
    let _ = unsafe {
        DwmSetWindowAttribute(
            window,
            DWMWA_TRANSITIONS_FORCEDISABLED,
            (&raw const off).cast::<c_void>(),
            size_of::<BOOL>() as u32,
        )
    };
    let _ = unsafe { ShowWindow(window, SW_SHOW) };
    let _ = unsafe { UpdateWindow(window) };
    // The app is in front (the user has just clicked it), so it may give the front to its own
    // window, and Esc reaches the picker.
    let _ = unsafe { SetForegroundWindow(window) };
}

/// A copy of every screen, in one bitmap the size of the virtual screen: its pixel (0, 0) is the
/// screen's (`left`, `top`), which is left of and above the main screen when a screen is there.
struct Snapshot {
    dc: HDC,
    bitmap: HBITMAP,
    old: HGDIOBJ,
    left: i32,
    top: i32,
    width: i32,
    height: i32,
}

impl Snapshot {
    fn of_screens() -> Result<Self, String> {
        let (left, top, width, height) = unsafe {
            (
                GetSystemMetrics(SM_XVIRTUALSCREEN),
                GetSystemMetrics(SM_YVIRTUALSCREEN),
                GetSystemMetrics(SM_CXVIRTUALSCREEN),
                GetSystemMetrics(SM_CYVIRTUALSCREEN),
            )
        };
        if width <= 0 || height <= 0 {
            return Err("there is no screen to take a colour from".into());
        }
        let screen = unsafe { GetDC(None) };
        if screen.is_invalid() {
            return Err("could not read the screen".into());
        }
        let dc = unsafe { CreateCompatibleDC(Some(screen)) };
        let bitmap = unsafe { CreateCompatibleBitmap(screen, width, height) };
        let copy = if dc.is_invalid() || bitmap.is_invalid() {
            if !bitmap.is_invalid() {
                let _ = unsafe { DeleteObject(bitmap.into()) };
            }
            if !dc.is_invalid() {
                let _ = unsafe { DeleteDC(dc) };
            }
            Err("could not make room for a copy of the screen".to_owned())
        } else {
            let old = unsafe { SelectObject(dc, bitmap.into()) };
            let copy = Self {
                dc,
                bitmap,
                old,
                left,
                top,
                width,
                height,
            };
            // CAPTUREBLT: the windows that draw themselves in layers (menus, tooltips) too.
            unsafe {
                BitBlt(
                    dc,
                    0,
                    0,
                    width,
                    height,
                    Some(screen),
                    left,
                    top,
                    SRCCOPY | CAPTUREBLT,
                )
            }
            .map(|()| copy)
            .map_err(|e| format!("could not copy the screen: {e}"))
        };
        unsafe { ReleaseDC(None, screen) };
        copy
    }

    /// The colour at (`x`, `y`) of the copy; None outside it.
    fn color(&self, at: POINT) -> Option<[u8; 3]> {
        if at.x < 0 || at.y < 0 || at.x >= self.width || at.y >= self.height {
            return None;
        }
        let COLORREF(bgr) = unsafe { GetPixel(self.dc, at.x, at.y) };
        // CLR_INVALID: the pixel could not be read.
        if bgr == u32::MAX {
            return None;
        }
        let [r, g, b, _] = bgr.to_le_bytes();
        Some([r, g, b])
    }
}

impl Drop for Snapshot {
    fn drop(&mut self) {
        unsafe {
            SelectObject(self.dc, self.old);
            let _ = DeleteObject(self.bitmap.into());
            let _ = DeleteDC(self.dc);
        }
    }
}

/// The loupe's label font.
struct Font(HFONT);

impl Font {
    fn new(height: i32) -> Self {
        Self(unsafe {
            CreateFontW(
                -height,
                0,
                0,
                0,
                FW_SEMIBOLD.0 as i32,
                0,
                0,
                0,
                DEFAULT_CHARSET,
                OUT_DEFAULT_PRECIS,
                CLIP_DEFAULT_PRECIS,
                CLEARTYPE_QUALITY,
                0,
                w!("Segoe UI"),
            )
        })
    }
}

impl Drop for Font {
    fn drop(&mut self) {
        if !self.0.is_invalid() {
            let _ = unsafe { DeleteObject(self.0.into()) };
        }
    }
}

/// A brush of one colour, for as long as it lives.
struct Brush(HBRUSH);

impl Brush {
    fn new(color: COLORREF) -> Self {
        Self(unsafe { CreateSolidBrush(color) })
    }
    fn fill(&self, dc: HDC, rect: &RECT) {
        unsafe { FillRect(dc, rect, self.0) };
    }
    fn frame(&self, dc: HDC, rect: &RECT) {
        unsafe { FrameRect(dc, rect, self.0) };
    }
}

impl Drop for Brush {
    fn drop(&mut self) {
        let _ = unsafe { DeleteObject(self.0.into()) };
    }
}

struct Picker {
    window: HWND,
    screen: Snapshot,
    /// The pointer, in the window's pixels, which are the copy's.
    at: POINT,
    /// The colour under the left button when it went down: it is taken when the button comes up,
    /// so that the window under the picker never gets half a click.
    pressed: Option<[u8; 3]>,
    /// Where the loupe is drawn now.
    loupe: RECT,
    /// The side of a pixel in the loupe, the height of the label under it, the room around the
    /// label's swatch, and the distance from the pointer: in the window's pixels, at its DPI.
    cell: i32,
    label: i32,
    pad: i32,
    gap: i32,
    font: Font,
    done: Done,
}

impl Picker {
    /// The loupe's place: below and after the pointer, or on another side of it where the
    /// screen the pointer is on ends.
    fn place(&self) -> RECT {
        let side = CELLS * self.cell + 2;
        let (width, height) = (side, side + self.label);
        let mut info = MONITORINFO {
            cbSize: size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        let on_screen = POINT {
            x: self.at.x + self.screen.left,
            y: self.at.y + self.screen.top,
        };
        let monitor = unsafe { MonitorFromPoint(on_screen, MONITOR_DEFAULTTONEAREST) };
        let bounds = if unsafe { GetMonitorInfoW(monitor, &raw mut info) }.as_bool() {
            let m = info.rcMonitor;
            RECT {
                left: m.left - self.screen.left,
                top: m.top - self.screen.top,
                right: m.right - self.screen.left,
                bottom: m.bottom - self.screen.top,
            }
        } else {
            RECT {
                left: 0,
                top: 0,
                right: self.screen.width,
                bottom: self.screen.height,
            }
        };
        let mut left = self.at.x + self.gap;
        if left + width > bounds.right {
            left = self.at.x - self.gap - width;
        }
        let mut top = self.at.y + self.gap;
        if top + height > bounds.bottom {
            top = self.at.y - self.gap - height;
        }
        RECT {
            left,
            top,
            right: left + width,
            bottom: top + height,
        }
    }

    /// Draws the copy of the screen where the window needs it, and the loupe over it.
    fn paint(&self) {
        let window = self.window;
        let mut paint = PAINTSTRUCT::default();
        let dc = unsafe { BeginPaint(window, &raw mut paint) };
        let dirty = paint.rcPaint;
        let (width, height) = (dirty.right - dirty.left, dirty.bottom - dirty.top);
        if !dc.is_invalid() && width > 0 && height > 0 {
            // Drawn off screen first, and put on the screen in one piece: the loupe never
            // flickers as the pointer moves.
            let back = unsafe { CreateCompatibleDC(Some(dc)) };
            let bitmap = unsafe { CreateCompatibleBitmap(dc, width, height) };
            if !back.is_invalid() && !bitmap.is_invalid() {
                let old = unsafe { SelectObject(back, bitmap.into()) };
                unsafe {
                    let _ = SetViewportOrgEx(back, -dirty.left, -dirty.top, None);
                    let _ = BitBlt(
                        back,
                        dirty.left,
                        dirty.top,
                        width,
                        height,
                        Some(self.screen.dc),
                        dirty.left,
                        dirty.top,
                        SRCCOPY,
                    );
                }
                self.draw_loupe(back);
                unsafe {
                    let _ = SetViewportOrgEx(back, 0, 0, None);
                    let _ = BitBlt(
                        dc,
                        dirty.left,
                        dirty.top,
                        width,
                        height,
                        Some(back),
                        0,
                        0,
                        SRCCOPY,
                    );
                    SelectObject(back, old);
                }
            }
            unsafe {
                if !bitmap.is_invalid() {
                    let _ = DeleteObject(bitmap.into());
                }
                if !back.is_invalid() {
                    let _ = DeleteDC(back);
                }
            }
        }
        let _ = unsafe { EndPaint(window, &raw const paint) };
    }

    /// The loupe: the pixels around the pointer, each a square, the middle one framed; and under
    /// them the colour of the middle one, as a swatch and as hex.
    fn draw_loupe(&self, dc: HDC) {
        let RECT {
            left, top, right, ..
        } = self.loupe;
        let (cell, half) = (self.cell, CELLS / 2);
        let panel = Brush::new(PANEL);
        panel.fill(dc, &self.loupe);
        // Only the part that is on the copy: what is beyond it (past the last screen) stays the
        // panel's colour, where a blit from outside a bitmap is undefined.
        let (from_x, from_y) = (self.at.x - half, self.at.y - half);
        let (x0, y0) = (from_x.max(0), from_y.max(0));
        let x1 = (from_x + CELLS).min(self.screen.width);
        let y1 = (from_y + CELLS).min(self.screen.height);
        if x1 > x0 && y1 > y0 {
            unsafe {
                SetStretchBltMode(dc, COLORONCOLOR);
                let _ = StretchBlt(
                    dc,
                    left + 1 + (x0 - from_x) * cell,
                    top + 1 + (y0 - from_y) * cell,
                    (x1 - x0) * cell,
                    (y1 - y0) * cell,
                    Some(self.screen.dc),
                    x0,
                    y0,
                    x1 - x0,
                    y1 - y0,
                    SRCCOPY,
                );
            }
        }
        // The middle pixel, framed in black and white so the frame shows on any colour.
        let middle = RECT {
            left: left + 1 + half * cell,
            top: top + 1 + half * cell,
            right: left + 1 + (half + 1) * cell,
            bottom: top + 1 + (half + 1) * cell,
        };
        let (black, white) = (Brush::new(BLACK), Brush::new(WHITE));
        black.frame(dc, &inflate(middle, 1));
        white.frame(dc, &middle);
        black.frame(dc, &self.loupe);

        let Some([r, g, b]) = self.screen.color(self.at) else {
            return;
        };
        let pad = self.pad;
        let row_top = top + 1 + CELLS * cell;
        let swatch = RECT {
            left: left + 1 + pad,
            top: row_top + pad,
            right: left + 1 + pad + (self.label - 2 * pad),
            bottom: row_top + self.label - pad,
        };
        Brush::new(COLORREF(u32::from_le_bytes([r, g, b, 0]))).fill(dc, &swatch);
        Brush::new(EDGE).frame(dc, &swatch);
        let mut text: Vec<u16> = format!("#{r:02X}{g:02X}{b:02X}").encode_utf16().collect();
        let mut row = RECT {
            left: swatch.right + pad,
            top: row_top,
            right: right - 1 - pad,
            bottom: row_top + self.label,
        };
        unsafe {
            let old = SelectObject(dc, self.font.0.into());
            SetBkMode(dc, TRANSPARENT);
            SetTextColor(dc, WHITE);
            DrawTextW(
                dc,
                &mut text,
                &raw mut row,
                DT_SINGLELINE | DT_VCENTER | DT_LEFT | DT_NOPREFIX,
            );
            SelectObject(dc, old);
        }
    }
}

fn inflate(rect: RECT, by: i32) -> RECT {
    RECT {
        left: rect.left - by,
        top: rect.top - by,
        right: rect.right + by,
        bottom: rect.bottom + by,
    }
}

fn create(owner: Option<HWND>, screen: &Snapshot) -> Result<HWND, String> {
    let instance = unsafe { GetModuleHandleW(None) }
        .map(|module| HINSTANCE(module.0))
        .map_err(|e| e.to_string())?;
    let class = WNDCLASSEXW {
        cbSize: size_of::<WNDCLASSEXW>() as u32,
        lpfnWndProc: Some(procedure),
        hInstance: instance,
        hCursor: unsafe { LoadCursorW(None, IDC_CROSS) }.unwrap_or_default(),
        lpszClassName: CLASS,
        ..Default::default()
    };
    // Registered by the first picker; the next ones find it there and the call fails, harmlessly.
    unsafe { RegisterClassExW(&raw const class) };
    // Owned by the app's window, which gets the focus back when the picker closes.
    unsafe {
        CreateWindowExW(
            WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
            CLASS,
            w!("Slidr"),
            WS_POPUP,
            screen.left,
            screen.top,
            screen.width,
            screen.height,
            owner,
            None,
            Some(instance),
            None,
        )
    }
    .map_err(|e| format!("could not open the eyedropper: {e}"))
}

/// Ends the picker: its window closes and `done` gets the answer. Nothing of the picker is
/// borrowed meanwhile: closing the window sends it messages of its own, which find no picker.
fn finish(picked: Picked) {
    let Some(picker) = PICKER.with_borrow_mut(Option::take) else {
        return;
    };
    let Picker { window, done, .. } = picker;
    unsafe {
        let _ = ReleaseCapture();
        let _ = DestroyWindow(window);
    }
    done(picked);
}

/// The pointer moved: the loupe follows it.
fn moved(at: POINT) {
    let moved = PICKER.with_borrow_mut(|picker| {
        let picker = picker.as_mut()?;
        let before = picker.loupe;
        picker.at = at;
        picker.loupe = picker.place();
        Some((picker.window, before, picker.loupe))
    });
    if let Some((window, before, after)) = moved {
        unsafe {
            let _ = InvalidateRect(Some(window), Some(&raw const before), false);
            let _ = InvalidateRect(Some(window), Some(&raw const after), false);
        }
    }
}

/// The point of a mouse message, in the window's pixels.
fn point(lparam: LPARAM) -> POINT {
    // Signed 16-bit halves: left of and above the window they are negative.
    POINT {
        x: i32::from((lparam.0 & 0xffff) as u16 as i16),
        y: i32::from(((lparam.0 >> 16) & 0xffff) as u16 as i16),
    }
}

fn color_under_pointer() -> Option<[u8; 3]> {
    PICKER.with_borrow(|picker| picker.as_ref().and_then(|p| p.screen.color(p.at)))
}

/// A key went down; `again` when it is held and this is its repeat.
fn key(code: VIRTUAL_KEY, again: bool) -> bool {
    match code {
        VK_ESCAPE => finish(Ok(None)),
        // Not on a repeat: an Enter that opened the eyedropper from its button, and is still
        // held when the picker opens, does not pick at once.
        VK_RETURN | VK_SPACE if again => {}
        VK_RETURN | VK_SPACE => finish(Ok(color_under_pointer())),
        VK_LEFT | VK_RIGHT | VK_UP | VK_DOWN => {
            let step = if unsafe { GetKeyState(i32::from(VK_SHIFT.0)) } < 0 {
                10
            } else {
                1
            };
            let (dx, dy) = match code {
                VK_LEFT => (-step, 0),
                VK_RIGHT => (step, 0),
                VK_UP => (0, -step),
                _ => (0, step),
            };
            let mut at = POINT::default();
            if unsafe { GetCursorPos(&raw mut at) }.is_ok() {
                // The move comes back as WM_MOUSEMOVE, and the loupe follows it there.
                let _ = unsafe { SetCursorPos(at.x + dx, at.y + dy) };
            }
        }
        _ => return false,
    }
    true
}

unsafe extern "system" fn procedure(
    window: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    let handled = match message {
        WM_PAINT => PICKER.with_borrow(|picker| picker.as_ref().map(Picker::paint).is_some()),
        // Everything is drawn in WM_PAINT; the screen under the window already shows the same.
        WM_ERASEBKGND => return LRESULT(1),
        WM_MOUSEMOVE => {
            moved(point(lparam));
            true
        }
        WM_LBUTTONDOWN => {
            let color = PICKER.with_borrow_mut(|picker| {
                let picker = picker.as_mut()?;
                picker.at = point(lparam);
                picker.pressed = picker.screen.color(picker.at);
                Some(picker.pressed)
            });
            if color.is_some() {
                unsafe { SetCapture(window) };
            }
            true
        }
        WM_LBUTTONUP => {
            let pressed = PICKER.with_borrow_mut(|picker| picker.as_mut()?.pressed.take());
            if let Some(color) = pressed {
                finish(Ok(Some(color)));
            }
            true
        }
        // A right click cancels; its press is eaten, so the app under the picker gets neither.
        WM_RBUTTONDOWN => true,
        WM_RBUTTONUP => {
            finish(Ok(None));
            true
        }
        // Bit 30: the key was already down, and this is its repeat.
        WM_KEYDOWN => key(VIRTUAL_KEY(wparam.0 as u16), lparam.0 & (1 << 30) != 0),
        // Another app took the front (Alt+Tab, the Start menu): the picker ends. Not in the
        // middle of the change of front, though: the window closes once the change is done. A
        // change of front inside the app does not end it: the picker covers the app, and a click
        // on it is what the user is there for.
        WM_ACTIVATEAPP if wparam.0 == 0 => {
            if PICKER.with_borrow(Option::is_some) {
                let _ = unsafe { PostMessageW(Some(window), WM_CLOSE, WPARAM(0), LPARAM(0)) };
            }
            false
        }
        WM_CLOSE => {
            finish(Ok(None));
            true
        }
        // The window is the size of every screen, whatever their DPI: it is not resized.
        WM_DPICHANGED => return LRESULT(0),
        _ => false,
    };
    if handled {
        LRESULT(0)
    } else {
        unsafe { DefWindowProcW(window, message, wparam, lparam) }
    }
}
