import type { ConnectionOptions } from './connection-options';
import type { DataServiceEventMap, DataServiceImpl } from './data-service';

/**
 * The IPC channel the renderer's `globalThis.postMessage` handshake is bridged
 * over (preload -> main -> utility process `parentPort`).
 */
export const DATA_SERVICE_PORT_CHANNEL = 'compass:data-service:port';

/** Payload the OIDC driver plugin hands to its `notifyDeviceFlow` callback. */
export interface DeviceFlowInfo {
  verificationUrl: string;
  userCode: string;
}

type PromiseMethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? K : never;
}[keyof T];

/** The async operations a renderer request can dispatch against the utility. */
export type OperationName = PromiseMethodKeys<DataServiceImpl>;

// ---------------------------------------------------------------------------
// renderer -> utility
// ---------------------------------------------------------------------------

/** A proxied data-service method call. */
export interface DataServiceRequest {
  kind: 'request';
  requestId: number;
  operation: OperationName;
  args: unknown[];
  bsonValues: Map<object, string>;
  placeholders: object[];
}

/** Asks the utility to abort the controller created for `requestId`. */
export interface AbortRequest {
  kind: 'abort';
  requestId: number;
}

/** Outcome of a renderer-side callback invocation that the utility shimmed. */
export type DeviceFlowResult =
  | { kind: 'deviceFlow:result'; id: number; ok: true }
  | { kind: 'deviceFlow:result'; id: number; ok: false; error: unknown };

/** Every message the renderer may send over the port. */
export type UtilityBoundMessage =
  | DataServiceRequest
  | AbortRequest
  | DeviceFlowResult;

// ---------------------------------------------------------------------------
// utility -> renderer
// ---------------------------------------------------------------------------

/** Asks the renderer to run its real `notifyDeviceFlow` (device-auth modal). */
export interface DeviceFlowInvocation {
  kind: 'deviceFlow';
  id: number;
  info: DeviceFlowInfo;
}

/**
 * A driver event emitted by the real DataService in the utility, boxed for the
 * journey and delivered to the renderer's local event listeners.
 */
export interface EventDelivery {
  kind: 'event';
  event: keyof DataServiceEventMap;
  data: unknown;
  bsonValues: Map<object, string>;
  placeholders: object[];
}

/** The reply to a `DataServiceRequest`. */
export type DataServiceResult =
  | {
      kind: 'result';
      responseTo: number;
      ok: true;
      res: unknown;
      bsonValues: Map<object, string>;
      placeholders: object[];
    }
  | { kind: 'result'; responseTo: number; ok: false; error: unknown };

/** Every message the utility may send over the port. */
export type RendererBoundMessage =
  | DataServiceResult
  | DeviceFlowInvocation
  | EventDelivery;

// ---------------------------------------------------------------------------
// boot handshake: renderer window -> preload -> main -> utility `parentPort`
// ---------------------------------------------------------------------------

export interface DataServiceBoot {
  type: typeof DATA_SERVICE_PORT_CHANNEL;
  id: number;
  /** Whether the renderer holds a real `oidc.notifyDeviceFlow` to forward to. */
  hasDeviceFlowNotify: boolean;
  connectionOptions: ConnectionOptions;
}
