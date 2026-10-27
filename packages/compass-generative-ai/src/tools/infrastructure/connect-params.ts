import { EJSON } from 'bson';
import type { ToolsConnectParams } from '../../tools-connection-manager';

/**
 * Connection options can carry BSON values: CSFLE encrypted field maps hold
 * `keyId` as Binary, for example. Structured cloning across the utility port
 * drops prototypes, which would hand the driver plain objects instead of BSON
 * values, so the connection parameters travel as EJSON, which round-trips
 * every BSON type.
 */
export function encodeConnectParams(connectParams: ToolsConnectParams): string {
  return EJSON.stringify(connectParams);
}

export function decodeConnectParams(encoded: string): ToolsConnectParams {
  return EJSON.parse(encoded) as ToolsConnectParams;
}
