import type { LGColumnDef } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';

const COLUMN_HEADERS = {
  'Name & Definition': 'indexes.table.header.nameAndDefinition',
  'Name and Fields': 'indexes.table.header.nameAndFields',
  Name: 'indexes.table.header.name',
  Type: 'indexes.table.header.type',
  Size: 'indexes.table.header.size',
  Usage: 'indexes.table.header.usage',
  Properties: 'indexes.table.header.properties',
  Status: 'indexes.table.header.status',
} as const;

const isTranslatableHeader = (
  header: unknown
): header is keyof typeof COLUMN_HEADERS =>
  typeof header === 'string' && header in COLUMN_HEADERS;

export function translateColumnHeaders<T>(
  columns: LGColumnDef<T>[],
  t: TranslateFn
): LGColumnDef<T>[] {
  return columns.map((column) =>
    isTranslatableHeader(column.header)
      ? { ...column, header: t(COLUMN_HEADERS[column.header], column.header) }
      : column
  );
}
