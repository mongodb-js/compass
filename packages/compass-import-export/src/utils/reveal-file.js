export default function revealFile(fileName) {
  const { shell } = require('electron');
  shell.showItemInFolder(fileName);
}
