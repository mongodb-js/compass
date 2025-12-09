import { createLogger } from '@mongodb-js/compass-logging';

const { debug } = createLogger('COMPASS-INTEGRATIONS-INTERCOM');

let isIntercomAllowedPromise: Promise<boolean> | null = null;

export function isIntercomAllowed(): Promise<boolean> {
  if (!isIntercomAllowedPromise) {
    isIntercomAllowedPromise = fetchIntegrations().then(
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
  return isIntercomAllowedPromise;
}

export function resetIntercomAllowedCache(): void {
  isIntercomAllowedPromise = null;
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
