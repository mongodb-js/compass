export const QUERY = 'QUERY';
export const FIELDS = 'FIELDS';
export const FILETYPE = 'FILETYPE';

export type ExportStep = 'QUERY' | 'FIELDS' | 'FILETYPE';

/**
 * State of export Modal progression.
 */
export const EXPORT_STEP = {
  QUERY,
  FIELDS,
  FILETYPE,
} as const;

export default EXPORT_STEP;
