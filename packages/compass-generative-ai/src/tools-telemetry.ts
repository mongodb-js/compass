import { AtlasTelemetry } from '@mongodb-js/mcp-atlas-telemetry';
import type { TelemetryConfig } from '@mongodb-js/mcp-atlas-telemetry';
import type { TelemetryCommonProperties } from '@mongodb-js/mcp-types';

/**
 * The MCP telemetry pipeline for Compass's in-memory Database Tools server.
 *
 * Two Compass-specific behaviours on top of {@link AtlasTelemetry}:
 * - every event carries `hosting_mode: 'compass'`, which the v1 integration
 *   passed as `telemetryProperties`;
 * - whether events are collected is read live from the caller, so toggling
 *   "usage statistics" takes effect without restarting the server.
 */
export class CompassMcpTelemetry extends AtlasTelemetry {
  private readonly isEnabled: () => boolean;

  constructor(config: TelemetryConfig, isEnabled: () => boolean) {
    super(config);
    this.isEnabled = isEnabled;
  }

  public override isTelemetryEnabled(): boolean {
    return this.isEnabled() && super.isTelemetryEnabled();
  }

  public override getCommonProperties(): TelemetryCommonProperties {
    return {
      ...super.getCommonProperties(),
      hosting_mode: 'compass',
    };
  }
}

/**
 * Builds and starts the Compass MCP telemetry pipeline.
 *
 * The pipeline is always constructed enabled so that turning the preference on
 * mid-session starts collection; `isEnabled` is the live gate. (The v1 wiring
 * only scheduled its send timer when telemetry happened to be enabled at server
 * start, so flipping the preference on later collected nothing.)
 */
export function createCompassMcpTelemetry(
  config: TelemetryConfig,
  isEnabled: () => boolean
): CompassMcpTelemetry {
  const instance = new CompassMcpTelemetry(config, isEnabled);
  void instance.setup();
  return instance;
}
