import { inspect as utilInspect } from 'util';
import { bsonStringifiers } from '@mongosh/service-provider-core';

// At the time of writing, the Compass dist package contains what appear to be
// 155 different copies of the 'bson' module. It is impractical to attach
// our inspection methods to each of those copies individually, like we do when
// we are inside cli-repl.
// Instead, we look for values with a _bsontype property inside the object graph
// before printing them here, and attach inspection methods to each of them
// individually.
// This is not particularly fast, but should work just fine for user-facing
// interfaces like printing shell output in the browser.

const customInspect = utilInspect.custom || 'inspect';
const visitedObjects = new WeakSet();

function tryAddInspect(obj: any, stringifier: (this: any) => string): void {
  try {
    Object.defineProperty(obj, customInspect, {
      writable: true,
      configurable: true,
      enumerable: false,
      value: function() {
        try {
          return stringifier.call(this);
        } catch (err) {
          console.warn('Could not inspect bson object', { obj: this, err });
          return utilInspect(this, { customInspect: false });
        }
      }
    });
  } catch (err) {
    console.warn('Could not add inspect key to object', { obj, err });
  }
}

function isDate(value: any): boolean {
  try {
    Date.prototype.getTime.call(value);
    return true;
  } catch {
    return false;
  }
}

function attachInspectMethods(obj: any): void {
  if ((typeof obj !== 'object' && typeof obj !== 'function') || obj === null) {
    // Ignore primitives
    return;
  }

  if (visitedObjects.has(obj)) {
    return;
  }
  visitedObjects.add(obj);

  // Traverse the rest of the object graph.
  attachInspectMethods(Object.getPrototypeOf(obj));
  const properties = Object.getOwnPropertyDescriptors(obj);
  for (const { value } of Object.values(properties)) {
    attachInspectMethods(value);
  }

  // Add obj[util.inspect.custom] if it does not exist and we can provide it.
  const bsontype = obj._bsontype;
  const stringifier = bsonStringifiers[bsontype];
  if (bsontype &&
      stringifier &&
      !(properties as any)[customInspect] &&
      !Object.isSealed(obj)) {
    tryAddInspect(obj, stringifier);
  } else if (isDate(obj)) {
    tryAddInspect(obj, function(this: Date): string {
      return this.toISOString();
    });
  }
}

export function inspect(value: any): string {
  attachInspectMethods(value);

  const stringifiedValue = utilInspect(value, {
    customInspect: true,
    depth: 1000,
    breakLength: 0
  });

  return stringifiedValue;
}

