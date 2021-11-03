import Analytics from 'analytics-node';
import { app } from 'electron';
import { ipcMain } from 'hadron-ipc';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { CompassApplication } from './application';

const { log, mongoLogId, debug } = createLoggerAndTelemetry('COMPASS-TELEMETRY');

interface EventInfo {
  event: string;
  properties: Record<string, any>;
}

const SEGMENT_API_KEY =
  process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE ||
  process.env.HADRON_METRICS_SEGMENT_API_KEY;
const SEGMENT_HOST =
  process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE ||
  process.env.HADRON_METRICS_SEGMENT_HOST;
const IS_CI = process.env.IS_CI || process.env.CI || process.env.EVERGREEN_BUILD_VARIANT;
const telemetryCapableEnvironment = !!(SEGMENT_API_KEY && (!IS_CI || SEGMENT_HOST));

class CompassTelemetry {
  private static analytics: Analytics | null = null;
  private static state: 'enabled' | 'disabled' | 'waiting-for-user-config' = 'waiting-for-user-config';
  private static queuedEvents: EventInfo[] = []; // Events that happen before we fetch user preferences
  private static currentUserId: string = '';
  private static lastReportedScreen: string = '';

  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static initPromise: Promise<void> | null = null;

  private static track(info: EventInfo) {
    const commonProperties = {
      compass_version: app.getVersion().split('.').slice(0, 2).join('.'), // only major.minor
      compass_distribution: process.env.HADRON_DISTRIBUTION,
      compass_channel: process.env.HADRON_CHANNEL
    };

    if (this.state === 'waiting-for-user-config' || !this.currentUserId) {
      this.queuedEvents.push(info);
      return;
    }

    if (this.state === 'disabled' || !this.analytics) {
      return;
    }

    if (info.event === 'Screen') {
      const { name, ...properties } = info.properties;
      if (name === this.lastReportedScreen) {
        return;
      }

      this.lastReportedScreen = name;
      this.analytics.screen({
        userId: this.currentUserId,
        name,
        properties: { ...properties, ...commonProperties }
      });
      return;
    }

    this.analytics.track({
      userId: this.currentUserId,
      event: info.event,
      properties: { ...info.properties, ...commonProperties }
    });
  }

  private static identify() {
    log.info(mongoLogId(1_001_000_093), 'Telemetry', 'Loading telemetry config', {
      telemetryCapableEnvironment,
      hasAnalytics: !!this.analytics,
      currentUserId: this.currentUserId,
      state: this.state,
      queuedEvents: this.queuedEvents.length
    });
    if (this.state === 'enabled' && this.analytics && this.currentUserId) {
      this.analytics.identify({
        userId: this.currentUserId,
        traits: {
          platform: process.platform,
          arch: process.arch
        },
      });
    }

    let event: EventInfo | undefined;
    while ((event = this.queuedEvents.shift()) !== undefined) {
      this.track(event);
    }
  }

  private static async _init(app: typeof CompassApplication) {
    process.on('compass:track', (meta: EventInfo) => {
      this.track(meta);
    });

    ipcMain.respondTo('compass:track', (evt, meta: EventInfo) => {
      (process as EventEmitter).emit('compass:track', meta);
    });

    ipcMain.respondTo('compass:usage:identify', (evt, meta: { currentUserId: string }) => {
      // This always happens after the first enable/disable call.
      this.currentUserId = meta.currentUserId;
      this.identify();
    });

    ipcMain.respondTo('compass:usage:enabled', () => {
      log.info(mongoLogId(1_001_000_094), 'Telemetry', 'Enabling Telemetry reporting');
      if (this.state !== 'enabled') {
        this.state = 'enabled';
        this.identify();
      }
    });

    ipcMain.respondTo('compass:usage:disabled', () => {
      log.info(mongoLogId(1_001_000_095), 'Telemetry', 'Disabling Telemetry reporting');
      this.state = 'disabled';
    });

    // only used in tests
    ipcMain.respondTo('compass:usage:flush', () => {
      this.analytics?.flush();
    });

    if (telemetryCapableEnvironment) {
      this.analytics = new Analytics(SEGMENT_API_KEY, { host: SEGMENT_HOST });

      app.addExitHandler(async () => {
        await new Promise(resolve => this.analytics.flush(resolve));
      });
    }
  }

  static init(app: typeof CompassApplication): Promise<void> {
    return this.initPromise ??= this._init(app);
  }
}

export { CompassTelemetry };
