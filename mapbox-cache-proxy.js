const Middleman = require('middleman-proxy');
const _ = require('lodash');
const debug = require('debug')('mongodb-compass:mapbox-cache-proxy');
const app = require('express')();

const proxy = new Middleman({
  target: 'https://compass-maps.mongodb.com/',
  bypass: () => {
    return false; // Cache *all* responses for demo time.
    // if (res.statusCode < 300) {
    //   return false; // this response is cached
    // } else {
    //   return true; // not caching this one
    // }
  }
});

proxy
  .on('request', (req) => {
    // For every request
    // res.setHeader('X-Always', 'true')
    debug('Incoming request for path', req.url);
  })
  .on('proxy request', (req, res) => {
    // For requests being proxied
    res.setHeader('X-Cache-Miss', '1');
    debug('Fetching response from origin for path', req.url);
  })
  .on('cache request', (req, res) => {
    // For requests with cached responses
    res.setHeader('X-Cache-Hit', '1');
    debug('serving cached response');
  });

app.use((req, res) => {
  proxy.http(req, res, {
    basePath: '/api.mapbox.com'
  });
});

const PORT = _.get(process.env, 'PORT', 3001);
app.listen(PORT, () => {
  debug(`Listening on 127.0.0.1:${PORT}`);
});
