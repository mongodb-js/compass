import Analytics from 'analytics-node';
import { app } from 'electron';
import { ipcMain } from 'hadron-ipc';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { CompassApplication } from './application';
import type { EventEmitter } from 'events';
import { getOsInfo } from '@mongodb-js/get-os-info';
import preferences from 'compass-preferences-model';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-TELEMETRY');

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
const IS_CI =
  process.env.IS_CI || process.env.CI || process.env.EVERGREEN_BUILD_VARIANT;
const telemetryCapableEnvironment = !!(
  SEGMENT_API_KEY &&
  (!IS_CI || SEGMENT_HOST)
);

class CompassTelemetry {
  private static analytics: Analytics | null = null;
  private static state: 'enabled' | 'disabled' = 'disabled';
  private static queuedEvents: EventInfo[] = []; // Events that happen before we fetch user preferences
  private static currentUserId?: string; // Deprecated field. Should be used only for old users to keep their analytics in Segment.
  private static telemetryAnonymousId = ''; // The randomly generated anonymous user id.
  private static lastReportedScreen = '';
  private static osInfo: ReturnType<typeof getOsInfo> extends Promise<infer T>
    ? Partial<T>
    : never = {};

  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static initPromise: Promise<void> | null = null;

  private static _getCommonProperties() {
    // Used in both track and identify to add common traits
    // to any event that we send to segment
    return {
      compass_version: app.getVersion().split('.').slice(0, 2).join('.'),
      compass_full_version: app.getVersion(),
      compass_distribution: process.env.HADRON_DISTRIBUTION,
      compass_channel: process.env.HADRON_CHANNEL,
    };
  }

  // Keep this method synchronous to avoid race conditions.
  private static _track(info: EventInfo) {
    const commonProperties = this._getCommonProperties();

    if (!this.telemetryAnonymousId) {
      this.queuedEvents.push(info);
      return;
    }

    if (this.state === 'disabled' || !this.analytics) {
      return;
    }
    if (info.event === 'Screen') {
      const name = info.properties.name;
      if (name === this.lastReportedScreen) {
        return;
      }
      this.lastReportedScreen = name;
    }

    this.analytics.track({
      userId: this.currentUserId,
      anonymousId: this.telemetryAnonymousId,
      event: info.event,
      properties: { ...info.properties, ...commonProperties },
    });
  }

  // Keep this method synchronous to avoid race conditions.
  private static identify() {
    log.info(
      mongoLogId(1_001_000_093),
      'Telemetry',
      'Loading telemetry config',
      {
        telemetryCapableEnvironment,
        hasAnalytics: !!this.analytics,
        currentUserId: this.currentUserId,
        telemetryAnonymousId: this.telemetryAnonymousId,
        state: this.state,
        queuedEvents: this.queuedEvents.length,
      }
    );
    if (
      this.state === 'enabled' &&
      this.analytics &&
      this.telemetryAnonymousId
    ) {
      this.analytics.identify({
        userId: this.currentUserId,
        anonymousId: this.telemetryAnonymousId,
        traits: {
          ...this._getCommonProperties(),
          platform: process.platform,
          arch: process.arch,
          ...this.osInfo,
        },
      });
    }

    let event: EventInfo | undefined;
    while ((event = this.queuedEvents.shift()) !== undefined) {
      this._track(event);
    }
  }

  private static _flushTelemetryAndIgnoreFailure() {
    return this.analytics?.flush().catch(() => Promise.resolve());
  }

  private static async _init(app: typeof CompassApplication) {
    const { trackUsageStatistics, currentUserId, telemetryAnonymousId } =
      preferences.getPreferences();
    this.currentUserId = currentUserId;
    this.telemetryAnonymousId = telemetryAnonymousId ?? '';

    try {
      this.osInfo = await getOsInfo();
    } catch (err: any) {
      log.error(
        mongoLogId(1_001_000_147),
        'Telemetry',
        'Failed to get OS info',
        { err: err.message }
      );
    }

    if (telemetryCapableEnvironment) {
      this.analytics = new Analytics(SEGMENT_API_KEY, { host: SEGMENT_HOST });

      app.addExitHandler(async () => {
        await this._flushTelemetryAndIgnoreFailure();
      });
    }

    const onTrackUsageStatisticsChanged = (value: boolean) => {
      if (value && this.state !== 'enabled') {
        log.info(
          mongoLogId(1_001_000_094),
          'Telemetry',
          'Enabling Telemetry reporting'
        );
        this.state = 'enabled';
        this.identify();
      } else if (!value && this.state !== 'disabled') {
        log.info(
          mongoLogId(1_001_000_095),
          'Telemetry',
          'Disabling Telemetry reporting'
        );
        this._track({
          event: 'Telemetry Disabled',
          properties: {},
        });
        void this._flushTelemetryAndIgnoreFailure();
        this.state = 'disabled';
      }
    };
    onTrackUsageStatisticsChanged(trackUsageStatistics); // initial setup with current value
    preferences.onPreferenceValueChanged(
      'trackUsageStatistics',
      onTrackUsageStatisticsChanged
    );

    process.on('compass:track', (meta: EventInfo) => {
      this._track(meta);
    });

    ipcMain?.respondTo('compass:track', (evt, meta: EventInfo) => {
      (process as EventEmitter).emit('compass:track', meta);
    });

    // only used in tests
    ipcMain?.respondTo('compass:usage:flush', () => {
      void this._flushTelemetryAndIgnoreFailure();
    });
  }

  static init(app: typeof CompassApplication): Promise<void> {
    this.initPromise ??= Promise.resolve(this._init(app));
    return this.initPromise;
  }

  static track(info: EventInfo): void {
    this._track(info);
  }
}

export { CompassTelemetry };
