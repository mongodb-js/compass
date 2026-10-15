import { AtlasTelemetry } from '@mongodb-js/mcp-atlas-telemetry';
import type {
  TelemetryBaseEvent,
  TelemetryConfig,
} from '@mongodb-js/mcp-atlas-telemetry';
import {
  ApiClient,
  userAgentFromServerMetadata,
  type HttpClient,
} from '@mongodb-js/mcp-atlas-api-client';
import type { LoggerBase } from '@mongodb-js/mcp-core';
import type {
  IDeviceId,
  IKeychain,
  ServerMetadata,
  TelemetryCommonProperties,
} from '@mongodb-js/mcp-types';
import { LazyDeviceId } from './lazy-device-id';

const ATLAS_API_BASE_URL = 'https://cloud.mongodb.com/';

// Compass only ever runs this in a browser or the Electron renderer.
const httpClient: HttpClient = {
  fetch: (...args) => globalThis.fetch(...args),
  Request: globalThis.Request,
};

export type CompassMcpTelemetryConfig = {
  logger: LoggerBase;
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
  // Held separately from the base class' private fields so `close` can release
  // them; the pipeline itself only ever flushes.
  private readonly apiClientRef: ApiClient;
  private readonly deviceIdRef: IDeviceId;
  private setupStarted = false;

  constructor(config: TelemetryConfig, isEnabled: () => boolean) {
    super(config);
    this.apiClientRef = config.apiClient;
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
    // Abort first: `super.close()` waits for setup, which waits on the machine
    // id, so aborting afterwards would be too late to shorten shutdown.
    this.deviceIdRef.close();
    // Flush before releasing the client the drain sends through.
    await super.close();
    await this.apiClientRef.close();
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
      apiClient: new ApiClient({
        options: {
          baseUrl: ATLAS_API_BASE_URL,
          userAgent: userAgentFromServerMetadata(config.serverMetadata),
          httpClient,
        },
        logger: config.logger,
      }),
    },
    isEnabled
  );
}
