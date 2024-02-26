/**
 * A helper function for opening the file explorer UI
 * to a highlighted path of `fileName` (e.g. "Show in Finder" on macOS)
 * using the builtin electron API.
 **/
export default function revealFile(fileName: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
  const electron: typeof import('electron') = require('electron');
  electron.ipcRenderer.send('show-file', fileName);
}
