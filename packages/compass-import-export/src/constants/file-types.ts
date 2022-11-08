export type AcceptedFileType = 'csv' | 'json';

const FILE_TYPES: {
  [AcceptedFileType: string]: string;
} = {
  CSV: 'csv',
  JSON: 'json',
} as const;

export default FILE_TYPES;
