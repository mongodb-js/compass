var app = require('./index.js');
var io = module.exports = require('socket.io')(app.server);
var config = require('mongoscope-config');
var ss = require('socket.io-stream');
var types = require('./models').types;
var debug = require('debug')('scout-server:io');
var _ = require('underscore');
var brain = require('../../scout-brain');
var async = require('async');


var createSampleStream = require('./streams/create-sample-stream');
var _idToDocument = require('./streams/id-to-document');
var EJSON = require('mongodb-extended-json');

module.exports = function unpack_param_create_ns(req, res, next, raw) {
  req.ns = types.ns(raw);
  req.params.database_name = req.ns.database;
  req.params.collection_name = req.ns.collection;
  next();
};

io.use(require('socketio-jwt').authorize({
  secret: config.get('token:secret').toString('utf-8'),
  handshake: true
}));

function prepare(socket, req, done) {
  req.params = _.extend({
    ns: req.ns
  }, _.clone(socket.decoded_token));

  var tasks = {};
  if (req.params.ns) {
    tasks.ns = function(next) {
      var ns = types.ns(req.params.ns);
      req.params.database_name = ns.database;
      req.params.collection_name = ns.collection;
      next();
    };

    tasks.token = function(next) {
      brain.loadToken(socket.decoded_token, req, next);
    };
  }

  if (Object.keys(tasks).length === 0) {
    return process.nextTick(function() {
      done();
    });
  }

  async.series(tasks, function(err) {
    if (err) return done(err);
    debug('prepared req %j', req);
    done();
  });
}

io.on('connection', function(socket) {
  ss(socket).on('collection:sample', function(stream, req) {
    prepare(socket, req, function() {
      debug('collection:sample got req %j', Object.keys(req));
      var db = req.mongo.db(req.params.database_name);
      createSampleStream(db, req.params.collection_name, {
        query: {},
        size: 5
      })
      .pipe(_idToDocument(db, req.params.collection_name, {
        fields: {}
      }))
      .pipe(EJSON.createStringifyStream())
      .pipe(stream);
    });
  });
  debug('token data %j', socket.decoded_token);
});
