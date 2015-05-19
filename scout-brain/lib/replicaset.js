var boom = require('boom'),
  async = require('async'),
  _ = require('underscore'),
  types = require('./types'),
  debug = require('debug')('scout-brain:replicaset');

function Replicaset(db) {
  this.db = db;
}

Replicaset.prototype.opcount = function(fn) {
  this.db.db('local').collection('oplog.rs').count(fn);
  return this;
};

// Replicaset.prototype.head = function(fn){
//   oplog(this.db.db('local')).since(0).find('head').first(function(err, doc){
//     if(err) return fn(err);
//     if(doc === undefined) return fn(boom.badRequest('Not a member of a replicaset'));
//     doc.ts = dateFromTimestamp(doc.ts);
//     fn(null, doc);
//   });
//   return this;
// };

// Replicaset.prototype.tail = function(fn){
//   oplog(this.db.db('local')).since(0).find('tail').first(function(err, doc){
//     if(err) return fn(err);
//     if(doc === undefined) return fn(boom.badRequest('Not a member of a replicaset'));
//     doc.ts = dateFromTimestamp(doc.ts);
//     fn(null, doc);
//   });
//   return this;
// };

Replicaset.prototype.config = function(fn) {
  this.db.db('local').collection('system.replset').findOne({}, function(err, res) {
    if (err) return fn(err);
    if (!res) return fn(boom.badRequest('Not a member of a replicaset.'));

    // @see http://docs.mongodb.org/manual/reference/replica-configuration/#local.system.replset.settings
    res.settings = res.settings || {
      chainingAllowed: true,
      getLastErrorDefaults: null,
      getLastErrorModes: null
    };
    fn(null, res);
  });
  return this;
};

// oplog collection stats like
//
// ```json
// { "capped" : true, "size" : 41943040, "autoIndexId" : false }
// ```
Replicaset.prototype.collection = function(fn) {
  this.db.db('local').collection('system.namespaces').findOne({
    name: 'local.oplog.rs'
  }, function(err, doc) {
    if (err) return fn(err);
    if (!doc || !doc.options) return fn(boom.badRequest('Not a member of a replicaset.'));
    fn(null, doc.options);
  });
  return this;
};

// @api private
Replicaset.prototype._status = function(fn) {
  this.db.admin().command({
    replSetGetStatus: 1
  }, {}, function(err, data) {
    if (err) return fn(err);

    var rs = data.documents[0];
    if (rs.ok === 0) return fn(boom.badRequest('Not a member of a replicaset.'));
    fn(null, rs);
  }.bind(this));
  return this;
};

// @aggregates head, tail, collection, opcount
Replicaset.prototype.state = function(fn) {
  async.parallel({
    head: this.head.bind(this),
    tail: this.tail.bind(this),
    collection: this.collection.bind(this),
    opcount: this.opcount.bind(this),
    rs: this._status.bind(this),
    config: this.config.bind(this),
  }, function(err, res) {
    if (err) return fn(err);

    var state = {
        _id: res.rs.set,
        members: [],
        oplog: {
          head: res.head,
          tail: res.tail,
          opcount: res.opcount,
          collection: res.collection,
        }
      },
      memberOpts = {};

    // Make a lookup map for member settings
    res.config.members.map(function(opts) {
      memberOpts[types.url(opts.host).getId()] = opts;
    });

    state.members = res.rs.members.map(function(member) {
      var instance_id = types.url(member.name).getId(),
        opts = memberOpts[instance_id],
        doc = {
          instance_id: instance_id,
          error_message: member.errmsg,
          is_healthy: member.health === 1,
          state: member.stateStr,
          state_id: member.state,
          uptime: member.uptime,
          optime: member.optimeDate,
          heartbeat: member.lastHeartbeat,
          heartbeat_previous: member.lastHeartbeatRecv,
          heartbeat_message: member.lastHeartbeatMessage,
          ping: member.pingMs,
          votes: opts.votes === undefined ? 1 : opts.votes,
          slave_delay: opts.slaveDelay === undefined ? 0 : opts.slaveDelay,
          tags: opts.tags === undefined ? {} : opts.tags,
          priority: opts.priority === undefined ? 1 : opts.priority,
          hidden: opts.hidden === undefined ? false : opts.hidden,
          build_indexes: opts.buildIndexes === undefined ? true : opts.buildIndexes,
          syncing_to: ( member.self ? res.rs.syncingTo : undefined)
        };

      // calculate the lags if we're a secondary
      if (member.optime) {
        doc.optime_count = member.optime.i;
      }
      doc.lag_operational = res.rs.date - member.lastHeartbeat;
      doc.lag_replication = res.tail.ts - member.optimeDate;
      return doc;
    });

    state.oplog.window = [res.head.ts, res.tail.ts];
    fn(null, state);
  });
  return this;
};

module.exports = function(db, fn) {
  var rs = new Replicaset(db);
  if (fn) {
    rs.state(fn);
  }
  return rs;
};

module.exports.discover = function(db, fn) {
  var conn = db.serverConfig,
    state = conn.s.replset.s.replState,
    rs = state.setName,
    instances = [];

  function add() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (Array.isArray(args[0])) {
      args = args[0];
    }

    instances.push.apply(instances, args.map(function(a) {
      return a.toJSON();
    }));
  }
  debug('discovering....');


  add(_.keys(state.secondaries).map(function(hp) {
    return types.url(types.instance_id(hp)).rs(rs).state('secondary');
  }));

  add(_.keys(state.arbiters).map(function(hp) {
    return types.url(types.instance_id(hp)).rs(rs).type('arbiter');
  }));

  add(_.keys(state.passives).map(function(hp) {
    return types.url(types.instance_id(hp)).rs(rs).type('passive');
  }));

  add(types.url(types.instance_id(state.primary.name)).rs(rs).state('primary'));
  debug('discovered `%j`', {
    instances: instances,
    type: 'replicaset',
    replicaset: rs
  });
  process.nextTick(function() {
    fn(null, {
      instances: instances,
      type: 'replicaset',
      replicaset: rs
    });
  });
};

module.exports.MemberState = {
  STARTUP: 0,
  PRIMARY: 1,
  SECONDARY: 2,
  RECOVERING: 3,
  FATAL: 4,
  STARTUP2: 5,
  UNKNOWN: 6, // remote node not yet reached
  ARBITER: 7,
  DOWN: 8, // node not reachable for a report
  ROLLBACK: 9,
  SHUNNED: 10 //node shunned from replica set
};
