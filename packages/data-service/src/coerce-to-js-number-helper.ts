import type { Long, Int32, Double } from 'bson';

type AnyBsonNumber =
  | number
  | typeof Long.prototype
  | typeof Int32.prototype
  | typeof Double.prototype;

export const coerceToJSNumber = (n: AnyBsonNumber): number => {
  if (typeof n === 'number') {
    return n;
  }
  return 'toNumber' in n ? n.toNumber() : n.valueOf();
};
