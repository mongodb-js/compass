var request = require('superagent'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  debug = require('debug')('scout-client:token');

module.exports = Token;

function Token(config) {
  if (!(this instanceof Token)) return new Token(config);

  this.config = config;
  this.expirationRedLine = 15 * 1000;
  this.session = {};

  process.nextTick(function() {
    this.bake(function(err) {
      if (err) return this.emit('error', err);
      this.schedule();
    }.bind(this));
  }.bind(this));
}
util.inherits(Token, EventEmitter);

Token.prototype.toString = function() {
  return this.session.token;
};

Object.defineProperty(Token.prototype, 'token', {
  get: function() {
    return this.session.token;
  }
});

var defaultFn = function(err) {
  if (err) return console.error(err);
};

Token.prototype.close = function(fn) {
  fn = fn || defaultFn;
  clearTimeout(this.refreshTimeout);
  debug('closing token');
  request.del(this.config.scout + '/api/v1/token')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + this.session.token)
    .end(function(err, res) {
      debug('response from token close');
      fn(err, res);
    });
};

Token.prototype.bake = function(done) {
  var payload = {
    seed: this.config.seed
  };

  if (this.config.timeout) {
    payload.timeout = this.config.timeout;
  }

  if (this.config.auth) {
    Object.keys(this.config.auth).map(function(name) {
      var service = this.config.auth[name];
      Object.keys(service).map(function(key) {
        payload[name + '_' + key] = service[key];
      });
    }.bind(this));
  }
  debug('getting token for', this.config.seed, payload);
  request.post(this.config.scout + '/api/v1/token')
    .send(payload)
    .set('Accept', 'application/json')
    .end(function(err, res) {
      if (err) {
        if (res && res.body) {
          err.message += ': ' + res.body.message;
        }
        console.error('Error getting token:', err);
        return done(err);
      }

      if (!err && res.status >= 400) {
        err = new Error(res.body ? res.body.message : res.text);
        err.code = res.status;
        Error.captureStackTrace(err, Token.prototype.bake);
        return done(err);
      }

      if (!res.body.expires_at || !res.body.created_at) {
        return done(new Error('Malformed response.  Missing expires_at or created_at'));
      }

      if (new Date(res.body.expires_at) - Date.now() < (1 * 60 * 1000)) {
        return done(new Error('Got an expires that is less than a minute from now.'));
      }

      this.session = res.body;
      this.emit('data', this.session);

      done(null, res.body);
    }.bind(this));
};

Token.prototype.refresh = function() {
  this.bake(function(err) {
    if (err) return this.emit('error', err);

    debug('token refreshed successfully');
    return this.schedule();
  }.bind(this));
};

Token.prototype.schedule = function() {
  if (!this.session) {
    console.warn('Session nuked but timeout not cleared');
    return this;
  }
  var ms = (new Date(this.session.expires_at) - Date.now()) - this.expirationRedLine;
  debug('scheduling token refresh %dms from now', ms);
  this.refreshTimeout = setTimeout(this.refresh.bind(this), ms);
};
