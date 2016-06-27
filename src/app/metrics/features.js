var BaseResource = require('mongodb-js-metrics').resources.BaseResource;
var FeatureResource = require('mongodb-js-metrics').resources.FeatureResource;
var app = require('ampersand-app');
var debug = require('debug')('mongodb-compass:metrics:features');
var _ = require('lodash');

// generic features with action `used`
var features = [
  'Clipboard Detection',
  'Document Viewer',
  'Query Builder',
  'Help Window',
  'Network Opt-in',
  'Share Schema',
  'Intercom Panel',
  'Feature Tour',
  'Connection',
  'Indexes'
];

var featureResources = _.object(_.map(features, function(feature) {
  var Klass = FeatureResource.extend({
    id: feature,
    eventTrackers: ['ga', 'intercom', 'mixpanel']
  });
  return [feature, new Klass()];
}));

// Geo Data uses `detected` as action
var GeoDataResource = FeatureResource.extend({
  id: 'Geo Data',
  eventTrackers: ['ga', 'intercom', 'mixpanel'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Collection uses `fetched` as action
var CollectionResource = FeatureResource.extend({
  id: 'Collection',
  eventTrackers: ['ga', 'intercom', 'mixpanel'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Deployment Data uses `detected` as action
var DeploymentResource = FeatureResource.extend({
  id: 'Deployment',
  eventTrackers: ['ga', 'intercom', 'mixpanel'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Schema resource uses `sampled` as action
var SchemaResource = BaseResource.extend({
  id: 'Schema',
  eventTrackers: ['ga', 'intercom', 'mixpanel'],
  sampled: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Index resource uses `detected` as action
var IndexesResource = BaseResource.extend({
  id: 'Indexes',
  eventTrackers: ['ga', 'intercom', 'mixpanel'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

var AutoUpdateResource = BaseResource.extend({
  id: 'Auto Update',
  eventTrackers: ['ga', 'intercom', 'mixpanel'],
  checking: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  uptodate: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  available: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  downloaded: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  cancelled: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  confirmed: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

var TreasureHuntResource = BaseResource.extend({
  id: 'Treasure Hunt',
  eventTrackers: ['intercom', 'mixpanel'],
  delayedLogin: function() {
    _.delay(function() {
      this.trackers.get('intercom')._updateIntercom();
    }.bind(this), 3000);
  },
  // connect to data server
  stage1: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'entered The Lost Temple.',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // show diary page
  stage2: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'found the missing part of Capt\'n Eliot Blackbeard\'s diary page.',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // open news collection
  stage3: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'entered the Library of Many Truths.',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // build query
  stage4: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'deciphered the secret enchantment.',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // updated to new version
  stage5: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'enchanted the Compass.',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // show indexed explain plan
  stage6: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'knows the location of the treasure.',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // build geo query
  stage7: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'travelled to the location of the treasure',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // click on the treasure value
  stage8: function(metadata, callback) {
    this._send_event({
      time: new Date(),
      achievement: 'found the treasure!',
      name: app.user.name
    }, callback);
    this.delayedLogin();
  },
  // unused
  stage9: function(metadata, callback) {
    this._send_event(metadata, callback);
    this.delayedLogin();
  },
  // unused
  stage10: function(metadata, callback) {
    this._send_event(metadata, callback);
    this.delayedLogin();
  }
});

featureResources['Treasure Hunt'] = new TreasureHuntResource();
featureResources['Geo Data'] = new GeoDataResource();
featureResources['Auto Update'] = new AutoUpdateResource();
featureResources.Collection = new CollectionResource();
featureResources.Deployment = new DeploymentResource();
featureResources.Schema = new SchemaResource();
featureResources.Indexes = new IndexesResource();

debug('feature resources', featureResources);

module.exports = featureResources;
