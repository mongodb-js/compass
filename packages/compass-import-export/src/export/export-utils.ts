import _ from 'lodash';
import type { Document } from 'mongodb';
import type { PathPart } from '../csv/csv-types';
import {
  csvHeaderNameToFieldName,
  formatCSVHeaderName,
} from '../csv/csv-utils';

export function lookupValueForPath(
  row: Document,
  path: PathPart[],
  allowObjectsAndArrays?: boolean
): any {
  /*
  Descend along objects and arrays to find a BSON value (ie. something that's
  not an object or an array) that we can stringify and put in a field.
  It is possible that not all docs have the same structure which is where we
  sometimes return undefined below.

  Imagine a collection:
  {foo: ['x']}
  {foo: { bar: 'y' }}
  {foo: 'z'}

  It would have the following columns:
  foo[0]
  foo.bar
  foo

  For each of the documents above it will return a string for one of the columns
  and undefined for the other two. Unless allowObjectsAndArrays is true, then
  the path "foo" will always return something that's not undefined. This is so
  we can support optionally serializing arrays and objects as EJSON strings.
  */

  let value: any = row;

  for (const part of path) {
    if (part.type === 'index') {
      if (Array.isArray(value)) {
        value = value[part.index];
      } else {
        return undefined;
      }
    } else {
      if (_.isPlainObject(value)) {
        value = value[part.name];
      } else {
        return undefined;
      }
    }
  }

  if (allowObjectsAndArrays) {
    return value;
  }

  if (Array.isArray(value)) {
    return undefined;
  }

  if (_.isPlainObject(value)) {
    return undefined;
  }

  return value;
}

export class ColumnRecorder {
  columnCache: Record<string, true>;
  columns: PathPart[][];

  constructor() {
    this.columnCache = {};
    this.columns = [];
  }

  cacheKey(path: PathPart[]) {
    // something that will make Record<> happy
    return JSON.stringify(path);
  }

  findInsertIndex(path: PathPart[]) {
    const headerName = formatCSVHeaderName(path);
    const fieldName = csvHeaderNameToFieldName(headerName);
    let lastIndex = -1;
    for (const [columnIndex, column] of this.columns.entries()) {
      const columnHeaderName = formatCSVHeaderName(column);
      const columnFieldName = csvHeaderNameToFieldName(columnHeaderName);

      if (columnFieldName === fieldName) {
        lastIndex = columnIndex;
      }
    }

    if (lastIndex !== -1) {
      return lastIndex + 1;
    }

    return this.columns.length;
  }

  addToColumns(value: any, path: PathPart[] = []) {
    // Something to keep in mind is that with arrays and objects we could
    // potentially have an enormous amount of distinct paths. In that case we
    // might want to either error or just EJSON.stringify() the top-level field.
    if (Array.isArray(value)) {
      for (const [index, child] of value.entries()) {
        this.addToColumns(child, [...path, { type: 'index', index }]);
      }
    } else if (_.isPlainObject(value)) {
      for (const [name, child] of Object.entries(
        value as Record<string, any>
      )) {
        this.addToColumns(child, [...path, { type: 'field', name }]);
      }
    } else {
      const cacheKey = this.cacheKey(path);
      if (!this.columnCache[cacheKey]) {
        this.columnCache[cacheKey] = true;
        this.columns.splice(this.findInsertIndex(path), 0, path);
      }
    }
  }
}
