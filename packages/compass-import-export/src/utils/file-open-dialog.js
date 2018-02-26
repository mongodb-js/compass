export default function fileOpenDialog(fileType) {
  const { dialog } = require('electron').remote;

  const filters = [{
    name: `${fileType} file`,
    extensions: [fileType.toLowerCase()]
  }];
  const title = 'Select file to import';

  return dialog.showOpenDialog({
    title,
    filters,
    properties: ['openFile', 'createDirectory', 'promptToCreate']
  });
}
