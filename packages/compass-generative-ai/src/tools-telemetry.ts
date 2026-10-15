import { AtlasTelemetry } from '@mongodb-js/mcp-atlas-telemetry';
import type { TelemetryConfig } from '@mongodb-js/mcp-atlas-telemetry';
import type { ApiClient } from '@mongodb-js/mcp-atlas-api-client';
import { DeviceId } from '@mongodb-js/mcp-tools-mongodb';
import type { LoggerBase } from '@mongodb-js/mcp-core';
import type {
  IDeviceId,
  IKeychain,
  ServerMetadata,
  TelemetryCommonProperties,
} from '@mongodb-js/mcp-types';

export type CompassMcpTelemetryConfig = {
  logger: LoggerBase;
  apiClient: ApiClient;
  keychain: IKeychain;
  serverMetadata: ServerMetadata;
};

/**
 * Resolves the machine id only when it is first asked for, so a disabled
 * telemetry preference never reads the machine id.
 */
class LazyDeviceId implements IDeviceId {
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

/**
 * The MCP telemetry pipeline for Compass's in-memory Database Tools server.
 *
 * Two Compass-specific behaviours on top of {@link AtlasTelemetry}:
 * - every event carries `hosting_mode: 'compass'`, which the v1 integration
 *   passed as `telemetryProperties`;
 * - whether events are collected is read live from the caller, so toggling
 *   "usage statistics" takes effect without restarting the server.
 *
 * The pipeline is not started until the first event that is actually allowed
 * through, so a disabled preference costs nothing: no machine id lookup, no
 * container probe and no send timer.
 */
export class CompassMcpTelemetry extends AtlasTelemetry {
  private readonly isEnabled: () => boolean;
  private readonly lazyDeviceId: LazyDeviceId;
  private setupStarted = false;

  constructor(
    config: TelemetryConfig,
    lazyDeviceId: LazyDeviceId,
    isEnabled: () => boolean
  ) {
    super(config);
    this.lazyDeviceId = lazyDeviceId;
    this.isEnabled = isEnabled;
  }

  public override isTelemetryEnabled(): boolean {
    return this.isEnabled() && super.isTelemetryEnabled();
  }

  public override emitEvents(
    events: Parameters<AtlasTelemetry['emitEvents']>[0]
  ): void {
    // `ToolBase` checks `isTelemetryEnabled()` before emitting, so this starts
    // the pipeline on the first event that the preference actually allows.
    if (this.isTelemetryEnabled() && !this.setupStarted) {
      this.setupStarted = true;
      void this.setup();
    }
    super.emitEvents(events);
  }

  public override async close(): Promise<void> {
    await super.close();
    this.lazyDeviceId.close();
  }

  public override getCommonProperties(): TelemetryCommonProperties {
    return {
      ...super.getCommonProperties(),
      hosting_mode: 'compass',
    };
  }
}

export function createCompassMcpTelemetry(
  config: CompassMcpTelemetryConfig,
  isEnabled: () => boolean
): CompassMcpTelemetry {
  const deviceId = new LazyDeviceId(config.logger);
  return new CompassMcpTelemetry(
    {
      ...config,
      // Always true so that the live preference is the only gate; nothing is
      // set up until `emitEvents` sees it enabled.
      enabled: true,
      deviceId,
    },
    deviceId,
    isEnabled
  );
}
