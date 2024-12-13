import http from 'http';
import { once } from 'events';
import type { AddressInfo } from 'net';

export const E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT =
  (process.env.E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT ??= '8081');

export type PreferencesServerResponse = {
  enableGenAIFeaturesAtlasProject: boolean;
  enableGenAISampleDocumentPassingOnAtlasProject: boolean;
  enableGenAIFeaturesAtlasOrg: boolean;
  optInDataExplorerGenAIFeatures: boolean;
};

function preferencesResponse(
  res: http.ServerResponse,
  response: PreferencesServerResponse
) {
  // Get request to hello service.
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(response));
}

export const enabledPreferencesResponse = {
  enableGenAIFeaturesAtlasProject: true,
  enableGenAISampleDocumentPassingOnAtlasProject: true,
  enableGenAIFeaturesAtlasOrg: true,
  optInDataExplorerGenAIFeatures: true,
};

export async function startPreferencesOverrideServer(
  response: PreferencesServerResponse = enabledPreferencesResponse
): Promise<{
  setPreferencesResponse: (response: PreferencesServerResponse) => void;
  endpoint: string;
  server: http.Server;
  stop: () => Promise<void>;
}> {
  const server = http
    .createServer((req, res) => {
      return preferencesResponse(res, response);
    })
    .listen(Number(E2E_TEST_ATLAS_PREFERENCES_OVERRIDE_PORT));
  await once(server, 'listening');

  // address() returns either a string or AddressInfo.
  const address = server.address() as AddressInfo;

  const endpoint = `http://localhost:${address.port}`;

  async function stop() {
    server.close();
    await once(server, 'close');
  }

  function setPreferencesResponse(newResponse: PreferencesServerResponse) {
    response = newResponse;
  }

  return {
    endpoint,
    server,
    setPreferencesResponse,
    stop,
  };
}
