export default function fileOpenDialog(fileType) {
  const { dialog } = require('electron').remote;

  const isFileTypesArray = Array.isArray(fileType);
  const filters = isFileTypesArray ?
  fileType.map(ft => ({
    name: `${ft} file`,
    extensions: [ft.toLowerCase()]
  })) :
  [{
    name: `${fileType} file`,
    extensions: [fileType.toLowerCase()]
  }];
  const title = isFileTypesArray ? 'Select file to import' : `Select ${fileType} target file`;

  return dialog.showOpenDialog({
    title,
    filters,
    properties: ['openFile', 'createDirectory', 'promptToCreate']
  });
}
