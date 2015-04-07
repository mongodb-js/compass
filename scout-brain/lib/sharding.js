var async = require('async'),
  types = {
    url: require('mongodb-url'),
    ns: require('mongodb-ns')
  },
  debug = require('debug')('monger:sharding');

function Sharding(db) {
  this.db = db.db('config');
  this.data = {
    settings: {},
    balancer: {},
    instances: [],
    collections: []
  };

  this.stats = {
    shards: {}
  };
}

Sharding.prototype.prepare = function(fn) {
  var self = this;
  async.parallel([
    this.version.bind(this),
    this.settings.bind(this),
    this.balancer.bind(this),
    this.databases.bind(this),
    this.getChunks.bind(this)
  ], function(err) {
      if (err) return fn(err);

      self.getShards(function(err, shards) {
        if (err) return fn(err);
        shards.map(function(shard) {
          shard.instances.map(function(inst) {
            self.data.instances.push(inst);
          });
        });

        self.db.collection('mongos').find({}).toArray(function(err, docs) {
          if (err) return fn(err);

          docs.map(function(doc) {
            self.data.instances.push(types.url(doc._id).type('router').toJSON());
          });

          self.getConfigServers(function(err, urls) {
            if (err) return fn(err);

            urls.map(function(url) {
              self.data.instances.push(types.url(url).type('config').toJSON());
            });
            debug('resolved instances', self.data.instances);
            fn(null, self.data);
          });
        });
      });
    });
};

Sharding.prototype.version = function(fn) {
  this.db.collection('version').find({}).toArray(function(err, data) {
    if (err) return fn(err);
    this.data.version = data && data[0];
    fn(err);
  }.bind(this));
};

Sharding.prototype.settings = function(fn) {
  var self = this;

  self.db.collection('settings').find({}).toArray(function(err, docs) {
    if (err) return fn(err);

    self.data.settings = {};
    docs.map(function(doc) {
      self.data.settings[doc._id] = doc.value;
    });
    fn();
  });
};

Sharding.prototype.balancer = function(fn) {
  var state = true,
    running = false;
  this.db.collection('settings').findOne({
    _id: 'balancer'
  }, function(err, doc) {
      if (err) return fn(err);
      if (doc) {
        state = !doc.stopped;
      }
      this.db.collection('locks').findOne({
        _id: 'balancer'
      }, function(err, doc) {
          if (err) return fn(err);
          if (doc) {
            running = doc.state > 0;
          }

          this.data.balancer = {
            state: state,
            running: running
          };
          fn();

        }.bind(this));
    }.bind(this));
};

Sharding.prototype.changelog = function(fn) {
  this.db.collection('changelog').find({}).toArray(fn);
};

Sharding.prototype.locks = function(fn) {
  this.db.collection('locks').find({}).toArray(fn);
};

Sharding.prototype.lockpings = function(fn) {
  this.db.collection('lockpings').find({}).toArray(fn);
};

Sharding.prototype.databases = function(fn) {
  var self = this;

  debug('gathering databases');
  self.db.collection('databases').find({}).sort({
    name: 1
  }).toArray(function(err, data) {
    if (err) return fn(err);
    self.data.databases = data;
    debug('databases on this cluster', data);
    async.parallel(data.map(function(database) {
      return function(done) {
        var q = {
          _id: new RegExp('^' + database._id + '\\.')
        };
        self.db.collection('collections').find(q).sort({
          _id: 1
        }).toArray(function(err, collections) {
          if (err) return done(err);
          debug('collections in ' + database._id, collections);
          async.parallel(collections.map(function(coll) {
            return function(cb) {
              self.getCollectionDetails(coll, cb);
            };
          }), done);
        });
      };
    }), fn);
  });
};

Sharding.prototype.getConfigServers = function(fn) {
  this.db.db('admin').command({
    getCmdLineOpts: 1
  }, function(err, data) {
      if (err) return fn(err);

      fn(null, data.parsed.sharding.configDB.split(','));
    });
};

Sharding.prototype.getCollectionStats = function(collectionId, done) {
  var ns = types.ns(collectionId);

  this.db.db(ns.database).command({
    collStats: ns.collection
  }, function(err, data) {
      if (err) return done(err);
      this.stats.shards[collectionId] = data.sharded;

      done(null, {
        sharded: data.sharded,
        stats: {
          index_sizes: data.indexSizes,
          document_count: data.count,
          document_size: data.size,
          storage_size: data.storageSize,
          index_count: data.nindexes,
          index_size: data.totalIndexSize,
          extent_count: data.numExtents,
          chunks_count: data.nchunks
        }
      });
    }.bind(this));
};

Sharding.prototype.getCollectionTags = function(collectionId, done) {
  this.db.collection('tags').find({
    ns: collectionId
  }).sort({
    min: 1
  }).toArray(done);
};

Sharding.prototype.getShards = function(fn) {
  this.db.collection('shards').find({}).toArray(function(err, docs) {
    if (err) return fn(err);
    debug('find shards', err, docs);

    var tasks = docs.map(function(doc) {
      return function(cb) {
        this.getShardDetail(doc._id, cb);
      }.bind(this);
    }.bind(this));

    async.parallel(tasks, fn);
  }.bind(this));
};

Sharding.prototype.getChunks = function(done) {
  this.db.collection('chunks').find({}).sort({
    min: 1
  }).toArray(function(err, data) {
    if (err) return done(err);

    done(null, data.map(function(doc) {
      return {
        _id: doc._id,
        last_modified_on: new Date(doc.lastmodEpoch.getTimestamp().getTime() + (doc.lastmod.high_ * 1000)),
        keyspace: [doc.min, doc.max],
        shard: doc.shard
      };
    }));
  });
};

Sharding.prototype.getShardDetail = function(shardId, done) {
  var detail = {
      instances: [],
      stats: {
        index_sizes: {},
        document_count: 0,
        document_size: 0,
        storage_size: 0,
        index_count: 0,
        index_size: 0,
        extent_count: 0,
        extent_last_size: 0,
        padding_factor: 0
      }
    },
    source = this.stats.shards[shardId];
  debug('get shard detail', shardId);

  this.db.collection('shards').find({
    _id: shardId
  }).toArray(function(err, data) {
    if (err) return done(err);

    data.map(function(doc) {
      var rs = doc.host.split('/')[0];
      doc.host.replace(rs + '/', '').split(',').map(function(h) {
        var instance = types.url(h).shard(shardId).toJSON();
        detail.instances.push(instance);
      }.bind(this));
    }.bind(this));

    if (source) {
      detail.stats = {
        index_sizes: source.indexSizes,
        document_count: source.count,
        document_size: source.size,
        storage_size: source.storageSize,
        index_count: source.nindexes,
        index_size: source.totalIndexSize,
        extent_count: source.numExtents,
        extent_last_size: source.lastExtentSize,
        padding_factor: source.paddingFactor
      };
    }
    debug('shard detail is', detail);
    done(null, detail);
  }.bind(this));
};

Sharding.prototype.getCollectionDetails = function(coll, fn) {
  var res = {
    _id: coll._id,
    sharded: false,
    shard_key: coll.key,
    stats: {},
    tags: [],
    shards: {}
  };

  debug('getting collection details', coll._id);
  async.parallel({
    stats: function(cb) {
      this.getCollectionStats(coll._id, cb);
    }.bind(this),
    tags: function(cb) {
      this.getCollectionTags(coll._id, cb);
    }.bind(this)
  }, function(err, r) {
      if (err) return fn(err);
      res.tags = r.tags;
      res.stats = r.stats.stats;
      fn(null, res);
    }.bind(this));
};

module.exports = function(db, fn) {
  return new Sharding(db).prepare(fn);
};

module.exports.discover = function(db, fn) {
  return new Sharding(db).prepare(function(err, info) {
    if (err) return fn(err);

    fn(null, {
      instances: info.instances,
      sharding: info.databases
    });
  });
};

module.exports.instances = function(db, fn) {
  new Sharding(db).prepare(function(err, info) {
    return (err) ? fn(err) : fn(null, info.instances);
  });
};
