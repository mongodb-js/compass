import { EJSON } from 'bson';

import { isSimpleObject } from './shape-utils';

export function stringifyBSON(value: any) {
  if (value?.inspect) {
    // TODO: This is a temporary hack - we'd use our existing formatters to
    // output colourful/rich previews of values, not just plain text and we
    // don't need this behaviour in unBSON() anyway - it doesn't matter that
    // jsondiffpatch sees `new ` when diffing.
    const s = value.inspect();
    if (s.startsWith('new ')) {
      return s.slice(4);
    }
    return s;
  }
  if (value?.toISOString) {
    return value.toISOString();
  }
  return EJSON.stringify(value);
}

export function unBSON(value: any | any[]): any | any[] {
  if (Array.isArray(value)) {
    return value.map(unBSON);
  } else if (isSimpleObject(value)) {
    const mapped: Record<string, any | any[]> = {};
    for (const [k, v] of Object.entries(value)) {
      mapped[k] = unBSON(v);
    }
    return mapped;
  } else if (value?._bsontype) {
    return stringifyBSON(value);
  } else {
    return value;
  }
}
