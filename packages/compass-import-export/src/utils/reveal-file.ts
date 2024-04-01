/**
 * A helper function for opening the file explorer UI
 * to a highlighted path of `fileName` (e.g. "Show in Finder" on macOS)
 * using the builtin electron API.
 **/
import { ipcRenderer } from 'hadron-ipc';

export default function revealFile(fileName: string) {
  // electron.shell.showItemInFolder(filename); was crashing Finder on macOS
  // when called from the renderer process. Doing it on main rather seems to
  // work fine.
  ipcRenderer?.send('show-file', fileName);
}
