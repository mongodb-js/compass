import _ from 'lodash';
import { stringify } from 'mongodb-query-parser';
import toNS from 'mongodb-ns';
import type { Document, SortDirection } from 'mongodb';
import { prettify } from '@mongodb-js/compass-editor';
import type { FormatOptions } from '@mongodb-js/compass-editor';

import type { ExportAggregation, ExportQuery } from '../export/export-types';

const codeFormatting: Partial<FormatOptions> = {
  singleQuote: true,
  trailingComma: 'none',
};

export function queryAsShellJSString({
  ns,
  query,
}: {
  ns: string;
  query: ExportQuery;
}) {
  let ret = `db.getCollection("${toNS(ns).collection}").find(`;
  ret += `${stringify(query.filter ? query.filter : {}) || ''}`;
  if (query.projection) {
    ret += `,${stringify(query.projection) || ''}`;
  }
  ret += ')';
  if (query.collation) {
    ret += `.collation(${stringify(query.collation as Document) || ''})`;
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
  return prettify(ret, 'javascript', codeFormatting);
}

export function aggregationAsShellJSString({
  ns,
  aggregation,
}: {
  ns: string;
  aggregation: ExportAggregation;
}) {
  const { stages, options = {} } = aggregation;

  let ret = `db.getCollection("${toNS(ns).collection}").aggregate([`;
  for (const [index, stage] of stages.entries()) {
    ret += `${stringify(stage) || ''}${index === stages.length - 1 ? '' : ','}`;
  }
  ret += ']';
  if (Object.keys(options).length > 0) {
    ret += ',';
    const filteredOptions = Object.fromEntries(
      Object.entries(options).filter((option) => option[1] !== undefined)
    );
    ret += stringify(filteredOptions);
  }
  ret += ');';
  return prettify(ret, 'javascript', codeFormatting);
}
