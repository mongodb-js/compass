import { EJSON } from 'bson';

import { getValueShape } from './shape-utils';

export function stringifyBSON(value: any) {
  if (value?.inspect) {
    return value.inspect();
  }
  if (value?.toISOString) {
    return value.toISOString();
  }
  return EJSON.stringify(value);
}

export function unBSON(value: any | any[]): any | any[] {
  const shape = getValueShape(value);
  if (shape === 'array') {
    return value.map(unBSON);
  } else if (shape === 'object') {
    const mapped: Record<string, any | any[]> = {};
    for (const [k, v] of Object.entries(value)) {
      mapped[k] = unBSON(v);
    }
    return mapped;
  } else if (value?._bsontype) {
    return stringifyBSON(value);
  } else if (Object.prototype.toString.call(value) === '[object RegExp]') {
    // make sure these match when diffing
    return value.toString();
  } else if (Object.prototype.toString.call(value) === '[object Date]') {
    // make sure dates are consistently strings when diffing
    return value.toISOString();
  } else {
    return value;
  }
}
