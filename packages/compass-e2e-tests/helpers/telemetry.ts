import { once } from 'events';
import http from 'http';
import type { AddressInfo } from 'net';
import { EJSON } from 'bson';
import type { MongoLogEntry } from 'mongodb-log-writer';

// TODO: lots of any here
export type Telemetry = {
  requests: any[];
  stop: () => Promise<void>;
  events: () => any[];
  key: string;
  screens: () => string[];
};

export type LogEntry = Omit<MongoLogEntry, 'id'> & { id: number };

export async function startTelemetryServer(): Promise<Telemetry> {
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

  // address() returns either a string or AddresInfo.
  const address = srv.address() as AddressInfo;

  const host = `http://localhost:${address.port}`;
  const key = '🔑';
  process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE = key;
  process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE = host;

  async function stop() {
    srv.close();
    await once(srv, 'close');
    delete process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE;
    delete process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE;
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
