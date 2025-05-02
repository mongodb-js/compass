import { createLogger } from '@mongodb-js/compass-logging';
const { mongoLogId, log } = createLogger('END-OF-LIFE-SERVER');

const FALLBACK_END_OF_LIFE_SERVER_VERSION = '4.4';
const { HADRON_AUTO_UPDATE_ENDPOINT, HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE } =
  process.env;
const updateEndpoint =
  HADRON_AUTO_UPDATE_ENDPOINT_OVERRIDE ?? HADRON_AUTO_UPDATE_ENDPOINT;

let latestEndOfLifeServerVersion: Promise<string> | null = null;

export async function getLatestEndOfLifeServerVersion(): Promise<string> {
  if (!updateEndpoint) {
    log.debug(
      mongoLogId(1_001_000_350),
      'getLatestEndOfLifeServerVersion',
      'HADRON_AUTO_UPDATE_ENDPOINT is not set'
    );
    return FALLBACK_END_OF_LIFE_SERVER_VERSION;
  }

  if (!latestEndOfLifeServerVersion) {
    // Setting module scoped variable to avoid repeated fetches.
    log.debug(
      mongoLogId(1_001_000_348),
      'getLatestEndOfLifeServerVersion',
      'Fetching EOL server version'
    );
    latestEndOfLifeServerVersion = fetch(`${updateEndpoint}/eol-server`)
      .then(async (response) => {
        if (response.ok) {
          const result = await response.text();
          log.debug(
            mongoLogId(1_001_000_349),
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
          mongoLogId(1_001_000_351),
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
