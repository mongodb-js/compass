const BaseResource = require('mongodb-js-metrics').resources.BaseResource;
const FeatureResource = require('mongodb-js-metrics').resources.FeatureResource;
const debug = require('debug')('mongodb-compass:metrics:features');
const _ = require('lodash');

// generic features with action `used`
const features = [
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

const featureResources = _.object(_.map(features, function(feature) {
  const Klass = FeatureResource.extend({
    id: feature,
    eventTrackers: ['ga', 'intercom', 'stitch']
  });
  return [feature, new Klass()];
}));

// Geo Data uses `detected` as action
const GeoDataResource = FeatureResource.extend({
  id: 'Geo Data',
  eventTrackers: ['ga', 'intercom', 'stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Collection uses `fetched` as action
const CollectionResource = FeatureResource.extend({
  id: 'Collection',
  eventTrackers: ['ga', 'intercom', 'stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Deployment Data uses `detected` as action
const DeploymentResource = FeatureResource.extend({
  id: 'Deployment',
  eventTrackers: ['ga', 'intercom', 'stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Schema resource uses `sampled` as action
const SchemaResource = BaseResource.extend({
  id: 'Schema',
  eventTrackers: ['ga', 'intercom', 'stitch'],
  sampled: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Index resource uses `detected` as action
const IndexesResource = BaseResource.extend({
  id: 'Indexes',
  eventTrackers: ['ga', 'intercom', 'stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

const AutoUpdateResource = BaseResource.extend({
  id: 'Auto Update',
  eventTrackers: ['ga', 'intercom', 'stitch'],
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

featureResources['Geo Data'] = new GeoDataResource();
featureResources['Auto Update'] = new AutoUpdateResource();
featureResources.Collection = new CollectionResource();
featureResources.Deployment = new DeploymentResource();
featureResources.Schema = new SchemaResource();
featureResources.Indexes = new IndexesResource();

debug('feature resources', featureResources);

module.exports = featureResources;
