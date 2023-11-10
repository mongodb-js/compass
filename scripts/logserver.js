// Simple HTTP server that logs out all requests it receives and just
// replies with 200 Ok. This is very useful when debugging telemetry:
// env HADRON_METRICS_SEGMENT_API_KEY='ignore' HADRON_METRICS_SEGMENT_HOST='http://localhost:8000' npm start
const http = require('http');

function write(payload) {
  if (process.stdout.isTTY) {
    console.dir(payload, { depth: Infinity });
  } else {
    process.stdout.write(JSON.stringify(payload) + '\n');
  }
}
http
  .createServer((req, res) => {
    let body = '';
    req
      .setEncoding('utf8')
      .on('data', (chunk) => {
        body += chunk;
      })
      .on('end', () => {
        try {
          body = JSON.parse(body);
        } catch {
          //
        }

        write({ headers: req.headers, body });
        res.writeHead(200);
        res.end('Ok\n');
      });
  })
  .listen(8000);
