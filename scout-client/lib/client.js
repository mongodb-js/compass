/**
 * @todo More reliable func tests (travis runs scout-server)
 * @todo Examples in client.js
 * @todo Doc tags for possible `err` objects (api blueprint like)
 * @todo Doc tags for possible `data` objects (api blueprint like)
 */
var request = require('superagent'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  Token = require('./token'),
  Context = require('./context'),
  createRouter = require('./router'),
  Subscription = require('./subscription'),
  assert = require('assert'),
  socketio = require('socket.io-client'),
  pkg = require('../package.json'),
  EJSON = require('mongodb-extended-json'),
  valid = require('./valid'),
  Resource = require('./resource'),
  defaults = require('./defaults'),
  debug = require('debug')('scout-client');

// Override superagent's parse and encode handlers rather than
// adding another content-type tooling doesnt like.
request.serialize['application/json'] = EJSON.stringify;
if (typeof window === 'undefined') {
  request.parse['application/json'] = function(res, fn) {
    res.text = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      res.text += chunk;
    });
    res.on('end', function() {
      try {
        fn(null, EJSON.parse(res.text));
      } catch (err) {
        fn(err);
      }
    });
  };
} else {
  request.parse['application/json'] = EJSON.parse;
}

var clients = {};
function clientId(opts) {
  return opts.scout + '/' + opts.seed;
}

module.exports = function(opts) {
  opts = opts || {};
  if (typeof opts !== 'object') {
    opts = {
      scout: opts
    };
  }
  if (!opts.scout) {
    opts.scout = defaults.scout;
  }
  if (!opts.auth) {
    opts.auth = defaults.auth;
  }
  if (!opts.seed) {
    opts.seed = defaults.seed;
  }

  opts.seed = opts.seed.replace('mongodb://', '');
  var _id = clientId(opts);

  if (!clients[_id]) {
    debug('creating new client', _id, clients);
    clients[_id] = new Client(opts);
    clients[_id].connect();
    return clients[_id];
  } else {
    debug('already have client');
    return clients[_id];
  }
};

module.exports.defaults = defaults;
module.exports.Backbone = require('./adapters/backbone.js');

function Client(opts) {
  if (!(this instanceof Client)) return new Client(opts);

  assert(opts.seed, 'Missing `seed` config value');
  assert(opts.scout, 'Missing `scout` config value');

  this.config = {
    seed: opts.seed,
    scout: opts.scout,
    driver: {
      name: pkg.name,
      version: pkg.version,
      lang: 'javascript'
    }
  };

  if (opts.timeout) {
    this.config.timeout = opts.timeout;
  }
  if (opts.auth) {
    this.config.auth = opts.auth;
  }

  this.context = new Context();
  this.readable = false;
  this.original = true;
  this.dead = false;
  this.closed = false;
  this._id = clientId(this.config);
}
util.inherits(Client, EventEmitter);

/**
 * Accquire a token.
 *
 * @api private
 */
Client.prototype.connect = function() {
  if (this.token) {
    console.warn('Already connected');
    return this;
  }
  this.token = new Token(this.config)
    .on('readable', this.onTokenReadable.bind(this))
    .on('error', this.onTokenError.bind(this));
  return this;
};

/**
 * Get details of the instance you're currently connected to
 * like database_names, results of the hostInfo and buildInfo mongo commands.
 *
 * ```javascript
 * scout.instance(function(err, data){
 *   if(err) return console.error(err);
 *   console.log('Databases on ' + scout.context.get('instance_id') + ':');
 *   data.datbase_names.map(console.log.bind(console, ' -'));
 * });
 * ```
 *
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @stability production
 * @group resource
 */
Client.prototype.instance = function(opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  return this.read('/', opts, fn);
};

/**
 * List all deployments this scout-server instance has connected to.
 *
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @stability production
 * @group resource
 */
Client.prototype.deployments = function(opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  return this.read('/deployments', opts, fn);
};

/**
 * List collection names and stats.
 *
 * @param {String} name
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @stability production
 * @return {resource.Database}
 * @group resource
 */
Client.prototype.database = function(name, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.database(name)) {
    throw new TypeError('Invalid database name `' + name + '`');
  }

  var resource = new Resource.Database(this, '/databases', name);
  return (!fn) ? resource : resource.read(opts, fn);
};

/**
 * Collection stats
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @stability production
 * @resource {resource.Collection}
 * @group resource
 */
Client.prototype.collection = function(ns, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    throw new TypeError('Invalid namespace string `' + ns + '`');
  }
  var resource = new Resource.Collection(this, '/collections', ns);
  return (!fn) ? resource : resource.read(opts, fn);
};

/**
 * Index details
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {String} name The index name
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @stability development
 * @return {resource.Index}
 * @group resource
 */
Client.prototype.index = function(ns, name, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    throw new TypeError('Invalid namespace string `' + ns + '`');
  }
  var resource = new Resource.Index(this, '/indexes/' + ns, name);
  return (!fn) ? resource : resource.read(opts, fn);
};

/**
 * Work with a single document.
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {String} _id The document's `_id` value
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @stability development
 * @return {resource.Document}
 * @group resource
 */
Client.prototype.document = function(ns, _id, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    throw new TypeError('Invalid namespace string `' + ns + '`');
  }
  var resource = new Resource.Document(this, '/documents/' + ns, _id);
  return (!fn) ? resource : resource.read(opts, fn);
};

/**
 * Run a query on `ns`.
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {Object} [opts] Placeholder for future options
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @option {Object} query default `{}`
 * @option {Number} limit default `10`, max 200
 * @option {Number} skip default 0
 * @option {Boolean} explain Return explain instead of documents default `false`
 * @option {Object} sort `{key: (1|-1)}` spec default `null`
 * @option {Object} fields
 * @option {Object} options
 * @option {Number} batchSize
 *
 * @group query
 * @stability production
 * @streamable
 */
Client.prototype.find = function(ns, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    return fn(new TypeError('Invalid namespace string `' + ns + '`'));
  }

  if (!fn) return new Resource.Collection(this, '/collections', ns).createReadStream(opts);

  return this.read('/collections/' + ns + '/find', {
    query: EJSON.stringify((opts.query || {})),
    limit: (opts.limit || 10),
    skip: (opts.skip || 0),
    explain: (opts.explain || false),
    sort: EJSON.stringify((opts.sort || undefined)),
    fields: EJSON.stringify((opts.fields || undefined)),
    options: EJSON.stringify((opts.options || undefined)),
    batchSize: EJSON.stringify((opts.batchSize || undefined))
  }, fn);
};

/**
 *  Run a count on `ns`.
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {Object} [opts]
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @option {Object} query default `{}`
 * @option {Number} limit default `10`, max 200
 * @option {Number} skip default 0
 * @option {Boolean} explain Return explain instead of documents default `false`
 * @option {Object} sort `{key: (1|-1)}` spec default `null`
 * @option {Object} fields
 * @option {Object} options
 * @option {Number} batchSize
 *
 * @group query
 * @stability production
 */
Client.prototype.count = function(ns, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  if (!valid.ns(ns)) {
    return fn(new TypeError('Invalid namespace string `' + ns + '`'));
  }

  var params = {
    query: EJSON.stringify((opts.query || {})),
    limit: (opts.limit || 10),
    skip: (opts.skip || 0),
    explain: (opts.explain || false),
    sort: EJSON.stringify((opts.sort || null)),
    fields: EJSON.stringify((opts.fields || null)),
    options: EJSON.stringify((opts.options || null)),
    batchSize: EJSON.stringify((opts.batchSize || null))
  };
  return this.read('/collections/' + ns + '/count', params, fn);
};

/**
 *  Run an aggregation pipeline on `ns`.
 *
 * @example http://codepen.io/imlucas/pen/BHvLE Run an aggregation and chart it
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {Array} pipeline
 * @param {Object} [opts]
 * @param {Function} fn A response callback `(err, data)`
 *
 * @option {Boolean} explain
 * @option {Boolean} allowDiskUse
 * @option {Object} cursor
 *
 * @group query
 * @stability development
 */
Client.prototype.aggregate = function(ns, pipeline, opts, fn) {
  if (!Array.isArray(pipeline)) {
    return fn(new TypeError('pipeline must be an array'));
  }
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    return fn(new TypeError('Invalid namespace string `' + ns + '`'));
  }

  return this.read('/collections/' + ns + '/aggregate', {
    pipeline: EJSON.stringify(pipeline),
    explain: (opts.explain || false),
    allowDiskUse: EJSON.stringify((opts.allowDiskUse || null)),
    cursor: EJSON.stringify((opts.cursor || null)),
    _streamable: true
  }, fn);
};

/**
 * Use [resevoir sampling](http://en.wikipedia.org/wiki/Reservoir_sampling) to
 * get a slice of documents from a collection efficiently.
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {Object} [opts]
 * @param {Function} fn A response callback `(err, data)`
 *
 * @option {Number} size The number of samples to obtain default `5`
 * @option {Object} query Restrict the sample to a subset default `{}`
 *
 * @group query
 * @stability development
 */
Client.prototype.sample = function(ns, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    var err = new TypeError('Invalid namespace string `' + ns + '`');
    if (fn) return fn(err);
    throw err;
  }

  if (fn) {
    return this.read('/collections/' + ns + '/sample', opts, fn);
  }
  opts.ns = ns;
  return this.createReadStream('collection:sample', opts);
};

/**
 *  Convenience to get 1 document via `Client.prototype.sample`.
 *
 * @param {String} ns A namespace string, eg `#{database_name}.#{collection_name}`
 * @param {Object} [opts]
 * @param {Function} fn A response callback `(err, data)`
 *
 * @option {Object} query Restrict the sample to a subset default `{}`
 *
 * @group query
 * @stability development
 */
Client.prototype.random = function(ns, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (!valid.ns(ns)) {
    return fn(new TypeError('Invalid namespace string `' + ns + '`'));
  }

  return this.sample(ns, opts, function(err, docs) {
    if (err) return fn(err);
    fn(null, docs[0]);
  });
};

/**
 * Maps backbone.js/express.js style routes to `Client.prototype` methods.
 *
 * @api private
 */
Client.prototype.routes = {
  '/instance': 'instance',
  '/deployments': 'deployments',
  '/deployments/:deployment_id': 'deployment',
  '/databases/:database': 'database',
  '/collections/:ns': 'collection',
  '/collections/:ns/count': 'count',
  '/collections/:ns/find': 'find',
  '/collections/:ns/aggregate': 'aggregate',
};

/**
 * Route `fragment` to a call on `Client.prototype`, which is substantially
 * easier for users on the client-side.  More detailled usage is available
 * in the [backbone.js adapter](/lib/backbone.js).
 *
 * @param {String} fragment One of `Client.prototype.routes`
 * @param {Object} [params]
 * @param {Function} [fn]
 *
 * @ignore
 */
Client.prototype.get = function(fragment, opts, fn) {
  opts = opts || {};
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  var resolved = this.resolve(fragment),
    handler = resolved[0],
    args = resolved[1];

  args.push.apply(args, [opts, fn]);
  return handler.apply(this, args);
};

/**
 * Resolve a client handler with a fragment string.
 *
 * @param {String} fragment
 * @return {Array} The {Function} and [{String}] args
 *
 * @ignore
 */
Client.prototype.resolve = function(fragment) {
  if (!this.router) {
    this.router = createRouter(this.routes);
  }
  var route = this.router.resolve(fragment);
  return [this[route.method], route.args];
};

/**
 * Disconnect everything.  Done automatically for you on window unload/process
 * exit if in nodejs.
 *
 * @param {Function} [fn] Optional callback for completely closed.
 *
 * @ignore
 */
Client.prototype.close = function(fn) {
  if (this.io) {
    this.io.close();
  }
  this.emit('close');
  this.closed = true;
  this.token.close(fn);
  clients[this._id] = null;
};

/**
 * All read requests come through here.
 * Handles queuing if still connecting and promoting streamables.
 *
 * @param {String} path Everything under `/api/v1` automatically prefixing instance.
 * @param {Object} [params]
 * @param {Function} [fn] A response callback `(err, data)`
 *
 * @api private
 */
Client.prototype.read = function(path, params, fn) {
  if (this.dead) return fn(this.dead);
  if (this.closed) return fn(new Error('Client already closed'));

  if (!this.readable) {
    debug('%s not readable.  queueing read', this._id, path, params);
    return this.on('readable', this.read.bind(this, path, params, fn));
  }

  if (typeof params === 'function') {
    fn = params;
    params = {};
  }
  var instance_id = this.context.get('instance_id'),
    streamable = params._streamable;
  delete params._streamable;

  if (!fn && !streamable) {
    var msg = 'not streamable and missing callback';
    if (fn) return fn(new Error(msg));
    throw new Error(msg);
  }

  if (streamable && !fn) return new Subscription(this, path, params);

  path = (path === '/') ? '/' + instance_id :
  (path !== '/deployments') ? '/' + instance_id + path : path;

  assert(this.token.toString());

  return request.get(this.config.scout + '/api/v1' + path)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + this.token.toString())
    .query(params)
    .end(this.ender(fn));
};

/**
 * Reponse handler for all superagent responses.
 *
 * @param {Function} fn A response callback `(err, data, res)`
 *
 * @api private
 */
Client.prototype.ender = function(fn) {
  return function(err, res) {
    if (!err && res.status >= 400) {
      err = new Error(res.body ? res.body.message : res.text);
      Error.captureStackTrace(err, Client.prototype.ender);
      err.status = res.status;
    }
    fn.apply(null, [err, (res && res.body), res]);
  };
};

/**
 * When we've acquired a security token, do child connections (eg socketio)
 * and unload handlers.
 *
 * If we're reusing an instance, but the user has changed context,
 * emit `change` so any open streams can easily end the old one
 * and open a new stream on the current one.
 *
 * @api private
 */
Client.prototype.onTokenReadable = function() {
  debug('token now readable');
  this.readable = true;
  this.context.set(this.token.session);
  if (!this.io) {
    this._initSocketio();
  }
  this.emit('readable', this.token.session);
  debug('emitted readable on client');

  if (!this.original) {
    this.emit('change');
  } else {
    if (typeof window !== 'undefined' && window.document) {
      if (window.attachEvent) {
        window.attachEvent('onunload', this.onUnload.bind(this));
      } else if (window.addEventListener) {
        window.addEventListener('beforeunload', this.onUnload.bind(this));
      }
    } else if (process && process.on) {
      process.on('exit', this.onUnload.bind(this));
    }
  }
};

/**
 * We couldn't get a token.
 *
 * @api private
 */
Client.prototype.onTokenError = function(err) {
  debug('Could not get token.  Server not running?', err);
  this.emit('error', err);
};

Client.prototype._initSocketio = function() {
  if (this.io) return;

  this.io = socketio(this.config.scout, {
    query: 'token=' + this.token.toString()
  });
  this.io.on('reconnecting', this.emit.bind(this, 'reconnecting'))
    .on('reconnect', this.onReconnect.bind(this))
    .on('reconnect_attempt', this.emit.bind(this, 'reconnect_attempt'))
    .on('reconnect_failed', this.emit.bind(this, 'reconnect_failed'))
    .on('disconnect', this.emit.bind(this, 'disconnect'));
  this.io.on('connect', function() {
    debug('connected to scout-server socket');
  });
};

/**
 * On browser window unload or process exit if running in nodejs,
 * make sure we clean up after ourselves.
 *
 * @api private
 */
Client.prototype.onUnload = function() {
  if (!this.closed) {
    debug('unloading so im closin');
    this.close();
  }
};

/**
 * When a token error occurs, the browser can't provide us with good
 * context in the error, so for now assuming all token errors
 * mean scout-server is not running.
 *
 * @param {Error} err
 * @api private
 */
Client.prototype.onTokenError = function(err) {
  this.dead = err;
  if (err >= 500) {
    this.dead.message += ' (scout-server dead at ' + this.config.scout + '?)';
  }
  this.emit('error', err);
};

Client.prototype.onReconnect = function() {
  debug('reconnected.  getting new token');
  this.token = new Token(this.config)
    .on('readable', function() {
      this.readable = true;
      this.context.set(this.token.session);
      this._initSocketio();
    }.bind(this))
    .on('error', this.emit.bind(this, 'error'));
};

var ss = require('socket.io-stream');
var es = require('event-stream');

Client.prototype.createReadStream = function(_id, data) {
  if (this.dead) {
    throw this.dead;
  }
  if (this.closed) {
    throw new Error('Client already closed');
  }

  if (!this.readable) {
    debug('not readable yet.  queueing read', _id, data);
    var client = this;
    var transferred = false;

    var proxy;
    var done;
    proxy = es.readable(function(count, fn) {
      done = fn;
      debug('proxy _read called with count', count);
      if (!client.readable) {
        return debug('client still not readable');
      }
      if (transferred) {
        return debug('proxy already transferred');
      }
    });
    this.on('readable', function() {
      debug('client readable');
      var src = client.createReadStream(_id, data);
      src.on('data', proxy.emit.bind(proxy, 'data'));
      src.on('error', proxy.emit.bind(proxy, 'error'));
      src.on('end', proxy.emit.bind(proxy, 'end'));
      transferred = true;
      process.nextTick(function() {
        done();
      });
    });
    return proxy;
  } else {
    data = data || {};
    var stream = ss.createStream(this.io);
    ss(this.io).emit(_id, stream, data);
    return stream.pipe(EJSON.createParseStream());
  }
};
