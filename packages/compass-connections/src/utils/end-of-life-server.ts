import semverSatisfies from 'semver/functions/satisfies';
import semverCoerce from 'semver/functions/coerce';

import { createLogger } from '@mongodb-js/compass-logging';

const { mongoLogId, log, debug } = createLogger('END-OF-LIFE-SERVER');

const FALLBACK_END_OF_LIFE_SERVER_VERSION = '4.4';
const {
  HADRON_AUTO_UPDATE_ENDPOINT = process.env
    .HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE,
} = process.env;

let latestEndOfLifeServerVersion: Promise<string> | null = null;

export async function getLatestEndOfLifeServerVersion(): Promise<string> {
  if (!HADRON_AUTO_UPDATE_ENDPOINT) {
    log.debug(
      mongoLogId(1_001_000_356),
      'getLatestEndOfLifeServerVersion',
      'HADRON_AUTO_UPDATE_ENDPOINT is not set'
    );
    return FALLBACK_END_OF_LIFE_SERVER_VERSION;
  }

  if (!latestEndOfLifeServerVersion) {
    // Setting module scoped variable to avoid repeated fetches.
    log.debug(
      mongoLogId(1_001_000_353),
      'getLatestEndOfLifeServerVersion',
      'Fetching EOL server version'
    );
    latestEndOfLifeServerVersion = fetch(
      `${HADRON_AUTO_UPDATE_ENDPOINT}/api/v2/eol-server`
    )
      .then(async (response) => {
        if (response.ok) {
          const result = await response.text();
          log.debug(
            mongoLogId(1_001_000_354),
            'getLatestEndOfLifeServerVersion',
            'Got EOL server version response',
            { result }
          );
          return result;
        } else {
          // Reset the cached value to null so that we can try again next time.
          latestEndOfLifeServerVersion = null;
          throw new Error(
            `Expected an OK response, got ${response.status} '${response.statusText}'`
          );
        }
      })
      .catch((error) => {
        log.error(
          mongoLogId(1_001_000_355),
          'getLatestEndOfLifeServerVersion',
          'Failed to fetch EOL server version',
          { error }
        );
        // We don't want any downstream code to fail just because we can't fetch the EOL server version.
        return FALLBACK_END_OF_LIFE_SERVER_VERSION;
      });
  }
  // Return a cached or in-flight value
  return latestEndOfLifeServerVersion;
}

export function isEndOfLifeVersion(
  version: string,
  latestEndOfLifeServerVersion: string
) {
  try {
    const coercedVersion = semverCoerce(version);
    return coercedVersion
      ? semverSatisfies(coercedVersion, `<=${latestEndOfLifeServerVersion}`)
      : false;
  } catch (error) {
    debug('Error comparing versions', { error });
    // If the version is not a valid semver, we can't reliably determine if it's EOL
    return false;
  }
}
