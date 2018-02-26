export default function fileSaveDialog(fileType) {
  const { dialog } = require('electron').remote;

  const filters = [{
    name: `${fileType} file`,
    extensions: [fileType.toLowerCase()]
  }];
  const title = `Select ${fileType} target file`;
  const buttonLabel = 'Select';

  return dialog.showSaveDialog({ title, filters, buttonLabel });
}
