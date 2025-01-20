import { once } from 'events';
import http from 'http';
import type { AddressInfo } from 'net';
import { EJSON } from 'bson';
import type { MongoLogEntry } from 'mongodb-log-writer';
import { TEST_COMPASS_WEB } from './compass';
import type { CompassBrowser } from './compass-browser';

export type Telemetry = {
  requests: any[];
  stop: () => Promise<void>;
  pollForEvents?: (browser: CompassBrowser) => Promise<void>;
  events: () => any[];
  key: string;
  screens: () => string[];
};

export type LogEntry = Omit<MongoLogEntry, 'id'> & { id: number };

function startFakeTelemetry(): Promise<Telemetry> {
  let tracking: any[] = [];
  let neverFetched = true;

  const events = (): any[] => {
    if (neverFetched) {
      throw new Error("Don't forget to telemetry.pollForEvents(browser);");
    }
    return tracking;
  };

  return Promise.resolve({
    key: '🔑',
    requests: [],
    stop: async () => {
      // noop
    },
    pollForEvents: async (browser: CompassBrowser): Promise<void> => {
      tracking = await browser.execute(function () {
        // eslint-disable-next-line no-restricted-globals
        return 'tracking' in window && (window.tracking as any);
      });

      neverFetched = false;
    },
    events,
    screens: (): any[] => {
      return events()
        .filter((entry) => entry.event === 'Screen')
        .map((entry) => entry.properties.name);
    },
  });
}

export async function startTelemetryServer(): Promise<Telemetry> {
  if (TEST_COMPASS_WEB) {
    return startFakeTelemetry();
  }

  const requests: any[] = [];
  const srv = http
    .createServer((req, res) => {
      let body = '';
      req
        .setEncoding('utf8')
        .on('data', (chunk) => {
          body += chunk;
        })
        .on('end', () => {
          requests.push({ req, body: EJSON.parse(body) });
          res.writeHead(200);
          res.end('Ok\n');
        });
    })
    .listen(0);
  await once(srv, 'listening');

  // address() returns either a string or AddressInfo.
  const address = srv.address() as AddressInfo;

  const host = `http://localhost:${address.port}`;
  const key = '🔑';
  process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE = key;
  process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE = host;
  process.env.HADRON_METRICS_SEGMENT_MAX_EVENTS_IN_BATCH = '1';

  async function stop() {
    srv.close();
    await once(srv, 'close');
    delete process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE;
    delete process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE;
    delete process.env.HADRON_METRICS_SEGMENT_MAX_EVENTS_IN_BATCH;
  }

  function events(): any[] {
    return requests.flatMap((req) => req.body.batch);
  }

  function screens(): any[] {
    return events()
      .filter((entry) => entry.event === 'Screen')
      .map((entry) => entry.properties.name);
  }

  return {
    key,
    requests,
    stop,
    events,
    screens,
  };
}
