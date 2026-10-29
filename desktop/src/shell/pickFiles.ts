/**
 * Asks for files with the system's file dialog. The input is made in code, not in JSX: it works
 * in the Tauri webview and in a browser alike. Resolves with nothing when the dialog is cancelled.
 */
export function pickFiles(accept: string, multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.hidden = true;
    const done = (files: File[]) => {
      input.remove();
      resolve(files);
    };
    input.addEventListener('change', () => done(Array.from(input.files ?? [])), { once: true });
    input.addEventListener('cancel', () => done([]), { once: true });
    // Attached while the dialog is open, so the input cannot be collected before it answers.
    document.body.append(input);
    input.click();
  });
}
