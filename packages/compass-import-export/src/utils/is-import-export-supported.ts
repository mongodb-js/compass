// Export saves through the File System Access API and keeps the CSV export
// temp file in the origin private file system. Browsers without them (Firefox
// and Safari at the time of writing) don't get import / export at all.
export function isImportExportSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showSaveFilePicker === 'function' &&
    typeof navigator.storage?.getDirectory === 'function'
  );
}
