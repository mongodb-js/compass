import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { IntercomMetadata } from './intercom-script';
import { IntercomScript, buildIntercomScriptUrl } from './intercom-script';
import ipc from 'hadron-ipc';

const { debug } = createLoggerAndTelemetry('COMPASS-INTERCOM');

type User = {
  id: string;
  createdAt: Date;
};

export async function setupIntercom(
  user: User,
  intercomScript: IntercomScript = new IntercomScript()
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.HADRON_ISOLATED === 'true') {
    debug('Skipping intercom setup on HADRON_ISOLATED');
    return;
  }

  const intercomAppId = process.env.HADRON_METRICS_INTERCOM_APP_ID;

  if (!intercomAppId) {
    debug(
      'skipping Intercom setup HADRON_METRICS_INTERCOM_APP_ID is not defined'
    );
    return;
  }

  const metadata: IntercomMetadata = {
    user_id: user.id,
    app_id: intercomAppId,
    created_at: Math.floor(user.createdAt.getTime() / 1000),
    app_name: process.env.HADRON_PRODUCT_NAME,
    app_version: process.env.HADRON_APP_VERSION,
    app_stage: process.env.NODE_ENV,
  };

  // In some environment the network can be firewalled, this is a safeguard to avoid
  // uncaught errors when injecting the script.
  debug('testing intercom availability');

  const intercomWidgetUrl = buildIntercomScriptUrl(metadata.app_id);

  const response = await fetch(intercomWidgetUrl).catch((e) => {
    debug('fetch failed', e);
    return null;
  });

  if (!response || response.status >= 400) {
    debug('intercom unreachable, skipping setup');
    return;
  }

  debug('intercom is reachable, proceeding with the setup');

  const preferences = await ipc.ipcRenderer.invoke('compass:get-all-preferences');
  if (preferences.enableFeedbackPanel) {
    debug(
      'intercom loading enqueued since enableFeedbackPanel was initially enabled'
    );
    intercomScript.load(metadata);
  } else {
    debug('enableFeedbackPanel is disabled, skipping loading intercom for now');
  }

  ipc.ipcRenderer.on('compass:preferences-changed', (_, preferences: any) => {
    debug('enableFeedbackPanel changed');
    // we need to re-check with if the fature is enabled to make sure all the
    // other settings for network usage are aligned too.
    if (preferences.enableFeedbackPanel) {
      debug('enqueuing intercom script loading');
      intercomScript.load(metadata);
    } else {
      debug('enqueuing intercom script unloading');
      intercomScript.unload();
    }
  });
}
