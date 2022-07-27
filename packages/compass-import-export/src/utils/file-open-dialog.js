export default function fileOpenDialog() {
  const { dialog, getCurrentWindow } = require('@electron/remote');

  const filters = [
    { name: 'All Files', extensions: ['*'] },
    { name: 'JSON', extensions: ['json', 'ndjson', 'jsonl'] },
    { name: 'CSV', extensions: ['csv', 'tsv'] },
  ];
  const title = 'Select a file to import';

  return dialog.showOpenDialog(getCurrentWindow(), {
    title,
    filters,
    properties: ['openFile', 'createDirectory', 'promptToCreate'],
  });
}
