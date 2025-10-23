import { UUID } from 'bson';
import type { UUIDString } from './types';

export function uuid(): UUIDString {
  return new UUID().toString();
}

const objectIds = new WeakMap<object, number>();
let objectIdCounter = 0;

export function getObjectId(obj: object): number {
  let id = objectIds.get(obj);
  if (id === undefined) {
    id = ++objectIdCounter;
    objectIds.set(obj, id);
  }
  return id;
}
