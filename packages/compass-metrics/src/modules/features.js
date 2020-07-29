import { resources } from 'mongodb-js-metrics';
import zipObject from 'lodash.zipobject';
import map from 'lodash.map';

const BaseResource = resources.BaseResource;
const FeatureResource = resources.FeatureResource;

const debug = require('debug')('mongodb-compass:metrics:features');

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

const featureResources = zipObject(map(features, function(feature) {
  const Klass = FeatureResource.extend({
    id: feature,
    eventTrackers: ['stitch']
  });
  return [feature, new Klass()];
}));

// Geo Data resource uses `detected` as action
const GeoDataResource = FeatureResource.extend({
  id: 'Geo Data',
  eventTrackers: ['stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Collection resource uses `fetched` as action
const CollectionResource = FeatureResource.extend({
  id: 'Collection',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Deployment resource uses `detected` as action
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

// Collection Stats resource uses 'fetched' as action
const CollectionStatsResource = BaseResource.extend({
  id: 'Collection Stats',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Topology resource uses 'detected' as action
const TopologyResource = BaseResource.extend({
  id: 'Topology',
  eventTrackers: ['stitch'],
  detected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Query resource uses 'applied' as action
const QueryResource = BaseResource.extend({
  id: 'Query',
  eventTrackers: ['stitch'],
  applied: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Application resource uses 'connected' as action
const ApplicationResource = BaseResource.extend({
  id: 'Application',
  eventTrackers: ['stitch'],
  connected: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Validation Rules resource uses 'fetched' as action
const ValidationRulesResource = BaseResource.extend({
  id: 'Validation Rules',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// SchemaValidation resource uses 'fetched', 'activated', 'saved',
// and 'rulesadded' as actions
const SchemaValidationResource = BaseResource.extend({
  id: 'SchemaValidation',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  activated: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  saved: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  rulesadded: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Explain resource uses 'fetched' as action
const ExplainResource = BaseResource.extend({
  id: 'Explain',
  eventTrackers: ['stitch'],
  fetched: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Document resource uses 'inserted', 'updated', and 'deleted' as actions
const DocumentResource = BaseResource.extend({
  id: 'Document',
  eventTrackers: ['stitch'],
  inserted: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  updated: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  deleted: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Aggregation resource uses 'executed', 'saved', and 'deleted' as actions
const AggregationResource = BaseResource.extend({
  id: 'Aggregation',
  eventTrackers: ['stitch'],
  executed: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  saved: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  deleted: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// AtlasLink resource uses 'clicked' as action
const AtlasLinkResource = BaseResource.extend({
  id: 'AtlasLink',
  eventTrackers: ['stitch'],
  clicked: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Documents resource uses 'loaded' as action
const DocumentsResource = BaseResource.extend({
  id: 'Documents',
  eventTrackers: ['stitch'],
  loaded: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Documents List View resource uses 'paginated' as action
const DocumentsListViewResource = BaseResource.extend({
  id: 'Documents List View',
  eventTrackers: ['stitch'],
  paginated: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Documents Table View resource uses 'paginated' as action
const DocumentsTableViewResource = BaseResource.extend({
  id: 'Documents Table View',
  eventTrackers: ['stitch'],
  paginated: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// License resource uses 'viewed' as action
const LicenseResource = BaseResource.extend({
  id: 'License',
  eventTrackers: ['stitch'],
  viewed: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Auto Update resource uses 'checking', 'uptodate', 'available',
// 'downloaded', 'cancelled' and 'confirmed' as actions
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

// Import resource uses 'completed' as action
const ImportResource = BaseResource.extend({
  id: 'Import',
  eventTrackers: ['stitch'],
  completed: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Export resource uses 'completed' as action
const ExportResource = BaseResource.extend({
  id: 'Export',
  eventTrackers: ['stitch'],
  completed: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Tour resource.
const TourResource = BaseResource.extend({
  id: 'Tour',
  eventTrackers: ['stitch'],
  closed: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

const ShellResource = BaseResource.extend({
  id: 'Shell',
  eventTrackers: ['stitch'],
  opened: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  show: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  use: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  ['api-call']: function(metadata, callback) {
    this._send_event(metadata, callback);
  },
  error: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

// Screen resource.
const ScreenResource = BaseResource.extend({
  id: 'Screen',
  eventTrackers: ['stitch'],
  viewed: function(metadata, callback) {
    this._send_event(metadata, callback);
  }
});

featureResources.Screen = new ScreenResource();
featureResources.Tour = new TourResource();
featureResources['Geo Data'] = new GeoDataResource();
featureResources['Auto Update'] = new AutoUpdateResource();
featureResources.Collection = new CollectionResource();
featureResources.AtlasLink = new AtlasLinkResource();
featureResources.Deployment = new DeploymentResource();
featureResources.Shell = new ShellResource();
featureResources.Schema = new SchemaResource();
featureResources.Indexes = new IndexesResource();
featureResources['Collection Stats'] = new CollectionStatsResource();
featureResources.Topology = new TopologyResource();
featureResources.Query = new QueryResource();
featureResources.Application = new ApplicationResource();
featureResources['Validation Rules'] = new ValidationRulesResource();
featureResources.SchemaValidation = new SchemaValidationResource();
featureResources.Explain = new ExplainResource();
featureResources.Import = new ImportResource();
featureResources.Export = new ExportResource();
featureResources.Aggregation = new AggregationResource();
featureResources.Document = new DocumentResource();
featureResources.Documents = new DocumentsResource();
featureResources.DocumentsListView = new DocumentsListViewResource();
featureResources.DocumentsTableView = new DocumentsTableViewResource();
featureResources.License = new LicenseResource();

debug('feature resources', featureResources);

export default featureResources;
