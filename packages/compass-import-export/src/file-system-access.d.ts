// TypeScript's DOM lib doesn't include the File System Access API pickers:
// https://wicg.github.io/file-system-access/#api-showsavefilepicker
// Only Chromium-based browsers implement them, hence the optional property.
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

interface Window {
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions
  ) => Promise<FileSystemFileHandle>;
}
