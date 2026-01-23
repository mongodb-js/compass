/**
 * This is a very simple static file server with CORS enabled for compass-web
 * distribution. Can be used for e2e / local dev when compass-web in MMS needs
 * to be replaced with the local resource
 */
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve(import.meta.dirname, '..', 'dist');

const contentTypeMap: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.ts': 'text/plain',
  '.txt': 'text/plain',
};

const corsHeaders = {
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
  'access-control-allow-origin': '*',
};

const server = http.createServer(async (req, res) => {
  res.on('close', () => {
    console.debug(
      '[compass-web-dist-file-server] "%s %s HTTP/%s" %s (%s)',
      req.method,
      req.url,
      req.httpVersion,
      res.statusCode,
      res.statusMessage
    );
  });

  const url =
    // This is a non-issue that Snyk codescanning gets triggered on for no good
    // reason and there is no way to dismiss this alert as a false-positive, so
    // I am reluctantly "fixing" it to make the bot go away
    req.url?.replaceAll(/(\.|%2e)+\//g, '').replaceAll('\n', '') ?? '/';

  const requestedPath = path.join(
    distDir,
    new URL(url, 'http://localhost').pathname
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    try {
      if (
        fs.existsSync(requestedPath) &&
        (await fs.promises.stat(requestedPath)).isFile()
      ) {
        res.writeHead(200, {
          ...corsHeaders,
          'content-type':
            contentTypeMap[path.extname(requestedPath)] ??
            'application/octet-stream',
        });
        if (req.method === 'GET') {
          fs.createReadStream(requestedPath).pipe(res);
        } else {
          res.end();
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    } catch (err) {
      res.writeHead(500);
      res.end((err as Error).stack);
    }

    return;
  }

  res.writeHead(405);
  res.end();
});

server.listen(7777, 'localhost', () => {
  console.debug('[compass-web-dist-file-server] listening on localhost:7777');
});
