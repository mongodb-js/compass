/**
 * A helper function for opening the file explorer UI
 * to a highlighted path of `fileName` (e.g. "Show in Finder" on macOS)
 * using the builtin electron API.
 * @param {String} fileName
 **/
export default function revealFile(fileName) {
  const { shell } = require('electron');
  shell.showItemInFolder(fileName);
}
