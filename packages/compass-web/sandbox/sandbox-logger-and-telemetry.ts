import createDebug from 'debug';
import { compassWebLoggingAndTrackingEvents } from '../src/logger-and-telemetry';

compassWebLoggingAndTrackingEvents.logging = [];
compassWebLoggingAndTrackingEvents.tracking = [];

const kSandboxLoggingAndTelemetryAccess = Symbol.for(
  '@compass-web-sandbox-logging-and-telemetry-access'
);

Object.defineProperty(globalThis, kSandboxLoggingAndTelemetryAccess, {
  get() {
    return compassWebLoggingAndTrackingEvents;
  },
});

export const debug = createDebug(`mongodb-compass:compass-web-sandbox`);
