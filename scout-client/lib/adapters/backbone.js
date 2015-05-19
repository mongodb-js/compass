/**
 * ## Backbone.js
 *
 * Objects you can extend Backbone Models and Collections from that
 * makes using mongoscope ridiculously simple.
 * ```javascript
 * var mongoscope = require('mongoscope-client'),
 *   Backbone = require('backbone'),
 *   Mackbone = mongoscope.adapters.Backbone,
 *   Model = Backbone.Model.extend(Mackbone.Model),
 *   Collection = Backbone.Model.extend(Mackbone.Collection);
 * ```
 */

var getOrCreateClient = require('../client');
var debug = require('debug')('scout-client:backbone');
// @todo: what to do with scout-types?

/**
 * @ignore
 *
 * Shim for `_.result()`.
 */
var _result = function(resource, key) {
  return (typeof resource[key] === 'function') ? resource[key]() : resource[key];
};

/**
 * ### property: `mongodb`
 *
 * Allows models to be fully self contained.  As per the rest of the Backbone
 * conventions, can be a literal value or function that returns the value.
 * Supports extended URI scheme so you can include a collection name.
 *
 * ```javascript
 * var Ticket = Mackbone.Model.extend({
 *   mongodb: 'localhost:27017/xgen.jira'
 * });
 *
 * var Ticket = Mackbone.Model.extend({
 *   mongodb: function(){
 *     return [
 *       Config.MONGO_HOST, ':', Config.MONGO_PORT, '/',
 *       Config.JIRA_DB, '.', Config.JIRA_COLLECTION
 *     ];
 *   }
 * });
 * ```
 *
 * Also allows getting crazy with the cheesewiz:
 *
 * ```javascript
 * // Read from my local copy of jira for searching because it's expensive.
 * var Tickets = Collection.extend({
 *   mongodb: 'mongodb://localhost:27017/xgen.jira',
 *   model: Ticket
 * });
 *
 * // CRUD to the kernel cluster though.
 * var Ticket = Model.extend({
 *   idAttr: '_id',
 *   mongodb: 'mongodb://kernel-jira.mongo-internal.com/xgen.jira-crud'
 * });
 * ```
 */
var _mongodb = function(resource) {
  var uri = _result(resource, 'mongodb');
  if (!uri) return undefined;

  if (uri.indexOf('mongodb://') !== 0) {
    uri = 'mongodb://' + uri;
  }

  var info = types.uri.parse(uri),
    ns = null;

  var mongodb = info.hosts[0].host + ':' + info.hosts[0].port;
  if (info.database && !resource.url) {
    ns = types.ns(info.database);
    if (ns.collection) {
      resource.url = '/collections/' + ns.toString() + '/find';
    }
  }
  return mongodb;
};

/**
 * `Backbone.sync` compatible handler to do the right thing with
 * `scout-client`.
 */
function sync(method, model, options) {
  var client = options.client || this.scout(options),
    ender = function(err, res) {
      if (err) {
        return options.error(err);
      }
      options.success(res);
    },
    fragment;

  // @todo: CRUD is now possible so should add it.  Something like:
  // ```javascript
  // if(client.isResource(url)){
  //   var resource = client.getResource(url);
  //   debug('Calling ' + resource.type + ' ' + method);
  //   if(method === 'read' && options.all){
  //     return resource.createReadStream(params).pipe(concat()).on('end', ender);
  //   }
  //   return resource[method](params, ender); // Client side error if unsupported method.
  // }
  // ```
  if (method !== 'read') {
    throw new Error('scout is readonly, so create, update, ' +
    'patch, and delete sync methods are not available.');
  }
  fragment = model.url;
  if (!fragment) {
    throw new Error('A "url" property or function must be specified');
  }

  var params = {},
    docs = [];

  // Filter backbone specific options out to get params to pass
  // to the scout-client call.
  Object.keys(options).map(function(k) {
    if (['error', 'success', 'client', 'parse'].indexOf(k) === -1) {
      params[k] = options[k];
    }
  });

  if (method === 'read') {
    if (!options.all) {
      // Normal api call.
      return client.get(fragment, params, ender);
    }

    // Some calls support read streams but aren't really resources
    // and they have a slightly different api.  Create a read stream,
    // concat all of its data, hit the callback.
    return client.get(fragment, params)
      .on('error', ender)
      .on('data', function(doc) {
        docs.push(doc);
      })
      .on('end', function() {
        ender(null, docs);
      });
  }
}

/**
 * @ignore
 */
var Base = {
  scout: function(opts) {
    opts = opts || {};
    if (!opts.mongodb && !opts.seed) {
      opts.mongodb = _mongodb(this);
    }
    var _page;
    if (typeof window !== 'undefined') {
      _page = 'http://' + window.location.hostname + ':' + window.location.port;
    }
    opts.endpoint = opts.endpoint || opts.instanceId || _page;
    return getOrCreateClient(opts);
  }
};

/**
 * Mixins for `Backbone.Model`.
 */
module.exports.Model = {
  sync: sync,
  scout: Base.scout
};

/**
 * Mixins for `Backbone.Collection`.
 */
module.exports.Collection = {
  sync: sync,
  mongoscope: Base.mongoscope
};

/**
 * Mixins for streams like log.  Impress your friends with this one simple
 * trick to tail a mongo log:
 *
 * ```javascript
 * var Log = Backbone.Collection.extend({ReadableStream}).extend({
 *   url: '/log'
 * });
 * var LogView = Backbone.View.extend({
 *   initialize: function(){
 *     this.log = new Log().on('sync', this.update, this).subscribe();
 *   },
 *   update: function(newLines){
 *     newLines.map(this.render.bind(this));
 *   },
 *   render: function(lineData){
 *     this.$el.append(this.tpls.line(lineData));
 *   }
 * });
 * ```
 */
module.exports.ReadableStream = {
  mongoscope: Base.mongoscope,
  subscription: null,
  subscribe: function() {
    if (this.subscription !== null) {
      debug('already have a subscription', this.subscription);
      return this;
    }

    var self = this,
      client = this.mongoscope(),
      url = _result(this, 'url');

    this.subscription = client.get(url)
      .on('error', function(err) {
        self.trigger('error', err, self);
      })
      .on('data', function(data) {
        if (!self.set(data)) return false;
        self.trigger('sync', self, data);
      });

    // If the client context changes, move our subscription.
    this.subscription.client.on('change', function() {
      self.unsubscribe().subscribe();
    });
    return this;
  },
  unsubscribe: function() {
    if (this.subscription === null) {
      debug('already unsubscribed');
      return this;
    }
    this.subscription.close();
    this.subscription = null;
    return this;
  }
};
