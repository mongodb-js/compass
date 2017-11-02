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
    eventTrackers: ['stitch']
  });
  return [feature, new Klass()];
}));

// Geo Data uses `detected` as action
const GeoDataResource = FeatureResource.extend({
  id: 'Geo Data',
  eventTrackers: ['stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Collection uses `fetched` as action
const CollectionResource = FeatureResource.extend({
  id: 'Collection',
  eventTrackers: ['stitch'],
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
  eventTrackers: ['stitch'],
  sampled: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Index resource uses `fetched` as action
const IndexesResource = BaseResource.extend({
  id: 'Indexes',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Collection Stats uses 'fetched' as action
const CollectionStatsResource = BaseResource.extend({
  id: 'Collection Stats',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Topology resources uses 'detected' as action
const TopologyResource = BaseResource.extend({
  id: 'Topology',
  eventTrackers: ['stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Query resources uses 'applied' as action
const QueryResource = BaseResource.extend({
  id: 'Query',
  eventTrackers: ['stitch'],
  applied: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Application resources uses 'connected' as action
const ApplicationResource = BaseResource.extend({
  id: 'Application',
  eventTrackers: ['stitch'],
  connected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// ValidationRules resources uses 'fetched' as action
const ValidationRulesResource = BaseResource.extend({
  id: 'Validation Rules',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Explain resources uses 'fetched' as action
const ExplainResource = BaseResource.extend({
  id: 'Explain',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
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
featureResources['Collection Stats'] = new CollectionStatsResource();
featureResources.Topology = new TopologyResource();
featureResources.Query = new QueryResource();
featureResources.Application = new ApplicationResource();
featureResources['Validation Rules'] = new ValidationRulesResource();
featureResources.Explain = new ExplainResource();

debug('feature resources', featureResources);

module.exports = featureResources;
