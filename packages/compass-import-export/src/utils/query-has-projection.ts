import type { ExportQuery } from '../export/export-types';

export function queryHasProjection(query: ExportQuery): boolean {
  return Object.keys(query?.projection || {}).length > 0;
}
