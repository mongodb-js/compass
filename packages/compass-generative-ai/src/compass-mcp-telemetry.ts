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
  /** Atlas API base URL. Defaults to production when not provided. */
  apiBaseUrl?: string;
};

/**
 * MCP telemetry for Compass's in-memory Database Tools server. Nothing is set
 * up until the first event the usage-statistics preference allows through.
 */
export class CompassMcpTelemetry extends AtlasTelemetry {
  private readonly isEnabled: () => boolean;
  private setupStarted = false;

  constructor(config: TelemetryConfig, isEnabled: () => boolean) {
    super(config);
    this.isEnabled = isEnabled;
  }

  public override isTelemetryEnabled(): boolean {
    return this.isEnabled() && super.isTelemetryEnabled();
  }

  public override emitEvents(events: TelemetryBaseEvent[]): void {
    // ToolBase checks isTelemetryEnabled() first, so setup only runs for
    // allowed events.
    if (this.isTelemetryEnabled() && !this.setupStarted) {
      this.setupStarted = true;
      void this.setup();
    }
    super.emitEvents(events);
  }

  public override async close(): Promise<void> {
    // Abort first: `super.close()` waits for setup, which waits on the machine id.
    this.deviceId.close();
    // Flush before releasing the client the drain sends through.
    await super.close();
    await this.apiClient.close();
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
          baseUrl: config.apiBaseUrl ?? ATLAS_API_BASE_URL,
          userAgent: userAgentFromServerMetadata(config.serverMetadata),
          httpClient,
        },
        logger: config.logger,
      }),
    },
    isEnabled
  );
}
