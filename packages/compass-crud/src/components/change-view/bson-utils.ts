import { EJSON } from 'bson';

import { getValueShape } from './shape-utils';
import { getBsonType } from 'hadron-type-checker';

export function stringifyBSON(value: any) {
  if (value?.inspect) {
    return value.inspect();
  }
  if (value?.toISOString) {
    try {
      return value.toISOString();
    } catch {
      return String(value);
    }
  }
  return EJSON.stringify(value);
}

export function unBSON(value: any): any {
  const shape = getValueShape(value);
  if (shape === 'array') {
    return value.map(unBSON);
  } else if (shape === 'object') {
    const mapped: Record<string, any> = Object.create(null);
    for (const [k, v] of Object.entries(value)) {
      mapped[k] = unBSON(v);
    }
    return mapped;
  } else if (getBsonType(value)) {
    return stringifyBSON(value);
  } else if (Object.prototype.toString.call(value) === '[object RegExp]') {
    // make sure these match when diffing
    return value.toString();
  } else if (Object.prototype.toString.call(value) === '[object Date]') {
    // make sure dates are consistently strings when diffing
    try {
      return value.toISOString();
    } catch {
      return String(value);
    }
  } else {
    return value;
  }
}
