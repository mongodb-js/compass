export type AcceptedFileType = 'csv' | 'json';

const FILE_TYPES: {
  [fileType: string]: AcceptedFileType;
} = {
  CSV: 'csv',
  JSON: 'json',
} as const;

export default FILE_TYPES;
