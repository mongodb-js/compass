/* eslint no-console: 0 */

var stitch = require('mongodb-stitch');
var State = require('ampersand-state');
var _ = require('lodash');
var singleton = require('singleton-js');
var debug = require('debug')('mongodb-js-metrics:trackers:stitch');
var redact = require('mongodb-redact');
var snakeCase = require('../shared').snakeCase;
var parseNamespaceString = require('mongodb-ns');

var os =
  typeof window === 'undefined'
    ? require('os')
    : require('electron').remote.require('os');

var StitchTracker = State.extend({
  id: 'stitch',
  props: {
    /**
     * Set through metrics.configure()
     */
    appId: ['string', true],
    users: {
      type: 'string',
      default: 'metrics.users'
    },
    events: {
      type: 'string',
      default: 'metrics.events'
    },
    /**
     * <set by `lib/resources/app.js`>
     */
    appName: ['string', false],
    appVersion: ['string', false],
    appStage: ['string', false],
    /**
     * </set by `lib/resources/app.js`>
     * <set by `lib/resources/user.js`>
     */
    userId: ['string', true],
    createdAt: ['date', false, null],
    name: {
      type: 'any',
      default: undefined,
      required: false,
      allowNull: true
    },
    email: {
      type: 'any',
      default: undefined,
      required: false,
      allowNull: true
    },
    developer: {
      type: 'any',
      default: undefined,
      required: false,
      allowNull: true
    }
  },
  session: {
    _eventsDatabaseName: 'any',
    _eventsCollectionName: 'any',
    _usersDatabaseName: 'any',
    _usersCollectionName: 'any',
    _client: 'any',
    enabled: ['boolean', true, false],
    hasBooted: ['boolean', true, false]
  },
  derived: {
    enabledAndConfigured: {
      deps: ['enabled', 'appId', 'userId'],
      fn: function() {
        return this.enabled && this.appId !== '' && this.userId !== '';
      }
    }
  },
  initialize: function() {
    this._identify = this._identify.bind(this);
    this._enabledConfiguredChanged = this._enabledConfiguredChanged.bind(this);

    this.on('change:enabledAndConfigured', this._enabledConfiguredChanged);
  },
  _enabledConfiguredChanged: function() {
    if (this.enabledAndConfigured) {
      this._setup();
      this._identify();
    }
  },
  _setup: function() {
    var eventsNS = parseNamespaceString(this.events);
    this._eventsDatabaseName = eventsNS.database;
    this._eventsCollectionName = eventsNS.collection;

    var usersNS = parseNamespaceString(this.users);
    this._usersDatabaseName = usersNS.database;
    this._usersCollectionName = usersNS.collection;

    this._client = new stitch.StitchClient(this.appId);
    debug('setup client', {
      _client: this._client,
      _eventsDatabaseName: this._eventsDatabaseName,
      _eventsCollectionName: this._eventsCollectionName,
      _usersDatabaseName: this._usersDatabaseName,
      _usersCollectionName: this._usersCollectionName
    });
  },
  _identify: function() {
    // this is only used when a user is first created ($setOnInsert)
    var newUserObj = {
      _id: this.userId,
      created_at: this.createdAt || new Date()
    };

    // this is used for every login ($set)
    var updateObj = {
      last_login: new Date(),
      name: this.name,
      email: this.email,
      developer: this.developer,
      app_name: this.appName,
      app_version: this.appVersion,
      app_stage: this.appStage
    };

    // host information
    if (typeof os !== 'undefined') {
      updateObj.host_arch = os.arch();
      updateObj.host_cpu_cores = os.cpus().length;
      updateObj.host_cpu_freq_mhz = _.get(os.cpus()[0], 'speed', 'unknown');
      updateObj.host_total_memory_gb = os.totalmem() / 1024 / 1024 / 1024;
      updateObj.host_free_memory_gb = os.freemem() / 1024 / 1024 / 1024;
    }

    if (!this.hasBooted) {
      this.hasBooted = true;
    }

    return this._getCollection(
      this._usersDatabaseName,
      this._usersCollectionName,
      function(err, collection) {
        if (err) {
          return debug('error sending identify to stitch: %s', err.message);
        }
        updateObj.stitch_user_id = this._client.authedId();
        debug('sending identify', redact(updateObj));
        return collection.updateOne(
          { _id: this.userId },
          { $set: updateObj, $setOnInsert: newUserObj },
          { upsert: true }
        );
      }.bind(this)
    );
  },
  _getCollection: function(db, name, fn) {
    if (!this.enabledAndConfigured) {
      return fn(new Error('stitch tracker not configured yet.'));
    }
    return this._client.login()
      .then(function() {
        var collection = this._client
          .service('mongodb', 'mongodb-atlas')
          .db(db)
          .collection(name);
        return fn(null, collection);
      }.bind(this))
      .catch(function(err) {
        return fn(err);
      });
  },
  /**
   * Sends an event to Stitch and attached metadata. The toplevel fields are
   *
   *   _id (the event_id)
   *   resource (the resource name, e.g. `App`)
   *   action (the action name, e.g. `launched`)
   *   user_id (the user_id as stored in the users collection as _id)
   *   created_at (current date and time)
   *   metadata (an object with redacted metadata, converted to snake_case keys)
   *
   * @param  {String} eventName    The event name to send, this is
   *                               usually `Resource action`, e.g. `App launched`.
   * @param  {Object} metadata     Metadata information
   */
  send: function(eventName, metadata) {
    var resource = eventName.split(' ')[0];
    var action = eventName.split(' ')[1];

    // toplevel fields
    var payload = Object.assign({
      _id: metadata['event id'],  // lift up from metadata
      resource: resource,
      action: action,
      user_id: this.userId,
      created_at: new Date()
    });

    // attach metadata
    delete metadata['event id'];
    payload.metadata = snakeCase(redact(metadata));

    // send payload
    return this._getCollection(
      this._eventsDatabaseName,
      this._eventsCollectionName,
      function(err, collection) {
        if (err) {
          return debug('error sending event to stitch: %s', err.message);
        }
        payload.stitch_user_id = this._client.authedId();
        debug('sending event `%s`', eventName, payload);
        return collection.insertOne(payload);
      }.bind(this)
    );
  }
});

module.exports = singleton(StitchTracker);
