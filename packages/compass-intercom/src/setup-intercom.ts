import { createLogger } from '@mongodb-js/compass-logging';
import type { IntercomMetadata } from './intercom-script';
import { IntercomScript, buildIntercomScriptUrl } from './intercom-script';
import type { PreferencesAccess } from 'compass-preferences-model';
import { getActiveUser } from 'compass-preferences-model';

const { debug } = createLogger('COMPASS-INTERCOM');

export async function setupIntercom(
  preferences: PreferencesAccess,
  intercomScript: IntercomScript = new IntercomScript()
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const { enableFeedbackPanel } = preferences.getPreferences();

  const intercomAppId = process.env.HADRON_METRICS_INTERCOM_APP_ID;

  if (!intercomAppId) {
    debug(
      'skipping Intercom setup HADRON_METRICS_INTERCOM_APP_ID is not defined'
    );
    return;
  }

  const user = getActiveUser(preferences);

  const metadata: IntercomMetadata = {
    user_id: user.id,
    app_id: intercomAppId,
    created_at: Math.floor(user.createdAt.getTime() / 1000),
    app_name: process.env.HADRON_PRODUCT_NAME,
    app_version: process.env.HADRON_APP_VERSION,
    app_stage: process.env.NODE_ENV,
  };

  async function toggleEnableFeedbackPanel(enableFeedbackPanel: boolean) {
    if (enableFeedbackPanel && (await isIntercomAllowed())) {
      debug('loading intercom script');
      intercomScript.load(metadata);
    } else {
      debug('unloading intercom script');
      intercomScript.unload();
    }
  }

  const shouldLoad = enableFeedbackPanel && (await isIntercomAllowed());

  if (shouldLoad) {
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
  } else {
    debug(
      'not testing intercom connectivity because enableFeedbackPanel == false || isAllowed == false'
    );
  }

  try {
    await toggleEnableFeedbackPanel(shouldLoad);
  } catch (error) {
    debug('initial toggle failed', {
      error,
    });
  }

  preferences.onPreferenceValueChanged(
    'enableFeedbackPanel',
    (enableFeedbackPanel) => {
      debug('enableFeedbackPanel changed');
      void toggleEnableFeedbackPanel(enableFeedbackPanel);
    }
  );
}

function isIntercomAllowed(): Promise<boolean> {
  return fetchIntegrations().then(
    ({ intercom }) => intercom,
    (error) => {
      debug(
        'Failed to fetch intercom integration status, defaulting to false',
        { error }
      );
      return false;
    }
  );
}

/**
 * TODO: Move this to a shared package if we start using it to toggle other integrations.
 */
function getAutoUpdateEndpoint() {
  const { HADRON_AUTO_UPDATE_ENDPOINT, HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE } =
    process.env;
  const result =
    HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE || HADRON_AUTO_UPDATE_ENDPOINT;
  if (!result) {
    throw new Error(
      'Expected HADRON_AUTO_UPDATE_ENDPOINT or HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE to be set'
    );
  }
  return result;
}

/**
 * Fetches the integrations configuration from the update server.
 * TODO: Move this to a shared package if we start using it to toggle other integrations.
 */
async function fetchIntegrations(): Promise<{ intercom: boolean }> {
  const url = `${getAutoUpdateEndpoint()}/api/v2/integrations`;
  debug('requesting integrations status', { url });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Expected an OK response, got ${response.status} '${response.statusText}'`
    );
  }
  const result = await response.json();
  debug('got integrations response', { result });
  if (typeof result.intercom !== 'boolean') {
    throw new Error(`Expected 'intercom' to be a boolean`);
  }
  return result;
}
