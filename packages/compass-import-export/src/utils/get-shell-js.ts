import _ from 'lodash';
import { stringify } from 'mongodb-query-parser';
import toNS from 'mongodb-ns';
import type { Document, SortDirection } from 'mongodb';

import type { ExportQuery } from '../export/export-types';

export function getQueryAsShellJSString({
  ns,
  query,
}: {
  ns: string;
  query: ExportQuery;
}) {
  let ret = `db.getCollection('${toNS(ns).collection}')`;
  ret += `.find(\n`;
  ret += `  ${stringify(query.filter ? query.filter : {}) || ''}`;
  if (query.projection) {
    ret += `,\n  ${stringify(query.projection) || ''}`;
  }
  ret += '\n)';
  if (query.collation) {
    ret += `.collation(\n  ${stringify(query.collation as Document) || ''}\n)`;
  }
  if (query.sort) {
    ret += `.sort(${
      _.isObject(query.sort) && !Array.isArray(query.sort)
        ? stringify(query.sort as Record<string, SortDirection>) || ''
        : JSON.stringify(query.sort)
    })`;
  }
  if (query.limit) {
    ret += `.limit(${query.limit})`;
  }
  if (query.skip) {
    ret += `.skip(${query.skip})`;
  }
  return ret;
}
