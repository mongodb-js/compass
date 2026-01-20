import createDebug from 'debug';
import { compassWebLoggingAndTrackingEvents } from '../src/logger';

compassWebLoggingAndTrackingEvents.logging = [];
compassWebLoggingAndTrackingEvents.tracking = [];

const kSandboxLoggingAndTelemetryAccess = Symbol.for(
  '@compass-web-sandbox-logging-and-telemetry-access'
);

(globalThis as any)[kSandboxLoggingAndTelemetryAccess] =
  compassWebLoggingAndTrackingEvents;

export const debug = createDebug(`mongodb-compass:compass-web-sandbox`);
