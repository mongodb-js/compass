import { Binary, UUID } from 'bson';
import type { ToolsConnectParams } from '../../tools-connection-manager';

const BSON_TYPES = { UUID, Binary } as const;

/**
 * Structured cloning across the utility port keeps BSON values but drops their
 * prototypes, so the driver would receive plain objects for e.g. the `keyId`
 * of an encrypted field.
 */
export type ConnectParamsWire = {
  connectParams: ToolsConnectParams;
  bsonValues: Map<unknown, string>;
};

export function encodeConnectParams(
  connectParams: ToolsConnectParams
): ConnectParamsWire {
  const bsonValues = new Map<unknown, string>();
  collectBsonValues(connectParams, bsonValues, new Set());
  return { connectParams, bsonValues };
}

export function decodeConnectParams({
  connectParams,
  bsonValues,
}: ConnectParamsWire): ToolsConnectParams {
  for (const [value, typeName] of bsonValues) {
    const bsonType = BSON_TYPES[typeName as keyof typeof BSON_TYPES];
    if (bsonType && typeof value === 'object' && value !== null) {
      Object.setPrototypeOf(value, bsonType.prototype);
    }
  }
  return connectParams;
}

function collectBsonValues(
  value: unknown,
  found: Map<unknown, string>,
  seen: Set<unknown>
): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return;
  }

  for (const [name, bsonType] of Object.entries(BSON_TYPES)) {
    if (value instanceof bsonType) {
      found.set(value, name);
      return;
    }
  }

  seen.add(value);

  for (const entryValue of Array.isArray(value)
    ? value
    : Object.values(value)) {
    collectBsonValues(entryValue, found, seen);
  }
}
