import { DeviceId } from '@mongodb-js/mcp-tools-mongodb';
import type { LoggerBase } from '@mongodb-js/mcp-core';
import type { IDeviceId } from '@mongodb-js/mcp-types';

/** Resolves the machine id on first use so it is never read while telemetry is off. */
export class LazyDeviceId implements IDeviceId {
  private readonly logger: LoggerBase;
  private resolved?: DeviceId;

  constructor(logger: LoggerBase) {
    this.logger = logger;
  }

  get(): Promise<string> {
    this.resolved ??= DeviceId.create(this.logger);
    return this.resolved.get();
  }

  close(): void {
    this.resolved?.close();
  }
}
