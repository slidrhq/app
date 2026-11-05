//! The eyedropper of the colour picker (TXT-04, SHP-02): a colour taken from anywhere on the
//! screen.
//!
//! WebView2 has the browser's `EyeDropper`, but not the part of the browser that shows it:
//! `open()` rejects at once, as though the user had cancelled (measured on WebView2 156,
//! 2026-11-05), and the eyedropper did nothing. So the app asks Windows itself: the screens are
//! copied and shown, frozen, in a window over all of them, with a loupe at the pointer, and the
//! pixel under the click is the answer.

use tauri::{Runtime, Window};

use crate::error::{AppError, Result};

#[cfg(windows)]
// Calls into Win32 and GDI: one of the app's five places for `unsafe`, with
// `capture/webview2.rs`, `import_window/network.rs`, `fonts/directwrite.rs` and
// `show_screen/win32.rs`.
#[allow(unsafe_code)]
mod win32;

/// `screen_pick_color()`: the colour of the pixel the user clicks, as `#rrggbb`; null when they
/// cancelled it (Esc, a right click, or a switch to another app).
#[tauri::command]
pub async fn screen_pick_color<R: Runtime>(window: Window<R>) -> Result<Option<String>> {
    Ok(pick(window).await?.map(hex))
}

#[cfg(windows)]
async fn pick<R: Runtime>(window: Window<R>) -> Result<Option<[u8; 3]>> {
    let (done, picked) = tokio::sync::oneshot::channel();
    let owner = window.clone();
    // The picker's window lives on the main thread, in the event loop of the app's own windows:
    // nothing waits for the user while they look for the colour.
    window
        .run_on_main_thread(move || {
            win32::start(
                owner.hwnd().ok(),
                Box::new(move |picked| {
                    let _ = done.send(picked);
                }),
            );
        })
        .map_err(AppError::internal)?;
    picked
        .await
        .map_err(AppError::internal)?
        .map_err(|e| AppError::internal(format!("could not take a colour from the screen: {e}")))
}

#[cfg(not(windows))]
async fn pick<R: Runtime>(window: Window<R>) -> Result<Option<[u8; 3]>> {
    let _ = window;
    Err(AppError::internal(
        "the eyedropper is made for Windows only",
    ))
}

fn hex([r, g, b]: [u8; 3]) -> String {
    format!("#{r:02x}{g:02x}{b:02x}")
}

#[cfg(test)]
mod tests {
    use super::hex;

    #[test]
    fn a_colour_is_written_as_css_writes_it() {
        assert_eq!(hex([0xea, 0xf0, 0xff]), "#eaf0ff");
        assert_eq!(hex([0, 7, 255]), "#0007ff");
    }
}
