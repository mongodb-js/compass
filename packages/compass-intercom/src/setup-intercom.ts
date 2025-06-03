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

  if (!(await isIntercomAllowed())) {
    debug('skipping Intercom (not allowed)');
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

  if (enableFeedbackPanel) {
    // In some environment the network can be firewalled, this is a safeguard to avoid
    // uncaught errors when injecting the script.
    debug('testing intercom availability');

    const intercomWidgetUrl = buildIntercomScriptUrl(metadata.app_id);

    const response = await window.fetch(intercomWidgetUrl).catch((e) => {
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
      'not testing intercom connectivity because enableFeedbackPanel == false'
    );
  }

  const toggleEnableFeedbackPanel = (enableFeedbackPanel: boolean) => {
    if (enableFeedbackPanel) {
      debug('loading intercom script');
      intercomScript.load(metadata);
    } else {
      debug('unloading intercom script');
      intercomScript.unload();
    }
  };

  toggleEnableFeedbackPanel(!!enableFeedbackPanel);

  preferences.onPreferenceValueChanged(
    'enableFeedbackPanel',
    (enableFeedbackPanel) => {
      debug('enableFeedbackPanel changed');
      toggleEnableFeedbackPanel(enableFeedbackPanel);
    }
  );
}

/**
 * Memoized promise that resolves to whether the intercom integration is allowed.
 * Access this through `this.isAllowed` to fire the request only once.
 */
let isIntercomAllowedResponse: null | Promise<boolean> = null;

function isIntercomAllowed(): Promise<boolean> {
  if (!isIntercomAllowedResponse) {
    isIntercomAllowedResponse = fetchIntegrations().then(
      ({ intercom }) => intercom,
      (error) => {
        debug(
          'Failed to fetch intercom integration status, defaulting to false',
          { error: error instanceof Error && error.message }
        );
        return false;
      }
    );
  }
  return isIntercomAllowedResponse;
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Expected an OK response, got ${response.status} '${response.statusText}'`
    );
  }
  const result = await response.json();
  debug('Got integrations response', { result });
  if (typeof result.intercom !== 'boolean') {
    throw new Error(`Expected 'intercom' to be a boolean`);
  }
  return result;
}
