// @ts-check
const { once } = require('events');
const http = require('http');

async function startTelemetryServer() {
  let requests = [];
  const srv = http
    .createServer((req, res) => {
      let body = '';
      req
        .setEncoding('utf8')
        .on('data', (chunk) => {
          body += chunk;
        })
        .on('end', () => {
          requests.push({ req, body: JSON.parse(body) });
          res.writeHead(200);
          res.end('Ok\n');
        });
    })
    .listen(0);
  await once(srv, 'listening');
  const host = `http://localhost:${srv.address().port}`;
  const key = '🔑';
  process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE = key;
  process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE = host;

  async function stop() {
    srv.close();
    await once(srv, 'close');
    delete process.env.HADRON_METRICS_SEGMENT_API_KEY_OVERRIDE;
    delete process.env.HADRON_METRICS_SEGMENT_HOST_OVERRIDE;
  }

  function events() {
    return requests.flatMap((req) => req.body.batch);
  }

  function screens() {
    return events()
      .filter((entry) => entry.event === 'Screen')
      .map((entry) => entry.properties.name);
  }

  return {
    requests,
    stop,
    events,
    key,
    screens,
  };
}

module.exports = {
  startTelemetryServer,
};
