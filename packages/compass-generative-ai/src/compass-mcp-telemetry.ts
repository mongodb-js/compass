import { AtlasTelemetry } from '@mongodb-js/mcp-atlas-telemetry';
import type {
  TelemetryBaseEvent,
  TelemetryConfig,
} from '@mongodb-js/mcp-atlas-telemetry';
import type { ApiClient } from '@mongodb-js/mcp-atlas-api-client';
import type { LoggerBase } from '@mongodb-js/mcp-core';
import type {
  IDeviceId,
  IKeychain,
  ServerMetadata,
  TelemetryCommonProperties,
} from '@mongodb-js/mcp-types';
import { LazyDeviceId } from './lazy-device-id';

export type CompassMcpTelemetryConfig = {
  logger: LoggerBase;
  apiClient: ApiClient;
  keychain: IKeychain;
  serverMetadata: ServerMetadata;
};

/**
 * MCP telemetry for Compass's in-memory Database Tools server.
 *
 * Adds the `hosting_mode` property the v1 integration set, and reads the usage
 * statistics preference live so toggling it needs no restart. Nothing is set up
 * — no machine id, no container probe, no send timer — until the first event
 * the preference allows through.
 */
export class CompassMcpTelemetry extends AtlasTelemetry {
  private readonly isEnabled: () => boolean;
  private readonly deviceIdRef: IDeviceId;
  private setupStarted = false;

  constructor(config: TelemetryConfig, isEnabled: () => boolean) {
    super(config);
    this.deviceIdRef = config.deviceId;
    this.isEnabled = isEnabled;
  }

  public override isTelemetryEnabled(): boolean {
    return this.isEnabled() && super.isTelemetryEnabled();
  }

  public override emitEvents(events: TelemetryBaseEvent[]): void {
    // ToolBase checks isTelemetryEnabled() before emitting, so setup only runs
    // for events the preference actually allows.
    if (this.isTelemetryEnabled() && !this.setupStarted) {
      this.setupStarted = true;
      void this.setup();
    }
    super.emitEvents(events);
  }

  public override async close(): Promise<void> {
    await super.close();
    this.deviceIdRef.close();
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
  return new CompassMcpTelemetry(
    {
      ...config,
      // Always true so the live preference is the only gate.
      enabled: true,
      deviceId: new LazyDeviceId(config.logger),
    },
    isEnabled
  );
}
