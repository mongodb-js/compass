import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { IntercomMetadata } from './intercom-script';
import { IntercomScript, buildIntercomScriptUrl } from './intercom-script';

import { preferencesIpc } from 'compass-preferences-model';

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

  const toggleEnableFeedbackPanel = (enableFeedbackPanel: boolean) => {
    if (enableFeedbackPanel) {
      debug('loading intercom script');
      intercomScript.load(metadata);
    } else {
      debug('unloading intercom script');
      intercomScript.unload();
    }
  };

  const { enableFeedbackPanel } = await preferencesIpc.getPreferences();
  toggleEnableFeedbackPanel(enableFeedbackPanel);

  preferencesIpc.onPreferencesChanged((prefs: any) => {
    debug('enableFeedbackPanel changed');
    toggleEnableFeedbackPanel(prefs.enableFeedbackPanel);
  });
}
