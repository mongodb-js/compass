import _ from 'lodash';
import { stringify } from 'mongodb-query-parser';
import toNS from 'mongodb-ns';

import type { ExportQueryType } from '../modules/export';
import type { ExportQuery } from '../export/export-types';

export function getQueryAsShellJSString(ns: string, spec: ExportQueryType) {
  let ret = `db.${toNS(ns).collection}.find(\n`;
  ret += `  ${stringify(spec.filter ? spec.filter : {}) || ''}`;
  if (spec.project) {
    ret += `,\n  ${stringify(spec.project) || ''}`;
  }
  ret += '\n)';
  if (spec.limit) {
    ret += `.limit(${spec.limit})`;
  }
  if (spec.skip) {
    ret += `.skip(${spec.skip})`;
  }
  return ret;
}

export function newGetQueryAsShellJSString({
  ns,
  query,
}: {
  ns: string;
  query: ExportQuery;
}) {
  let ret = `db.getCollection("${toNS(ns).collection}").find(\n`;
  ret += `  ${stringify(query.filter ? query.filter : {}) || ''}`;
  if (query.project) {
    ret += `,\n  ${stringify(query.project) || ''}`;
  }
  ret += '\n)';
  if (query.sort) {
    ret += `.sort(${
      _.isObject(query.sort) && !Array.isArray(query.sort)
        ? stringify(query.sort as Record<string, unknown>) || ''
        : JSON.stringify(query.sort)
    })`; // typeof query.sort === 'string' ? query.sort : (stringify(query.sort) || '')})`;
  }
  if (query.limit) {
    ret += `.limit(${query.limit})`;
  }
  if (query.skip) {
    ret += `.skip(${query.skip})`;
  }
  return ret;
}
