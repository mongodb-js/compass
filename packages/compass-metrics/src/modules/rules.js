import schemaStats from 'mongodb-schema/lib/stats';

const ATLAS = /mongodb.net[:/]/i;
const LOCALHOST = /(^localhost)|(^127\.0\.0\.1)/gi;

/**
 * This file defines rules for tracking metrics based on Reflux store changes.
 *
 * Each rule is an object with the following keys:
 *
 * @param {String} store        Which store to listen to (e.g. "App.InstanceStore")
 * @param {String} resource     The metrics resource to trigger (e.g. "App",
 *                              "Deployment", ...)
 * @param {String} action       Which action to trigger on the resource (e.g.
 *                              "launched", "detected", ...)
 * @param {Function} condition  Function that receives the store state, and
 *                              returns whether or not the event should be tracked.
 * @param {Function} metadata   Function that receives the store state, and
 *                              returns a metadata object to attach to the event.
 */
const RULES = [
  {
    registryEvent: 'compass:screen:viewed',
    resource: 'Screen',
    action: 'viewed',
    condition: () => true,
    metadata: (version, state) => ({
      ...state,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:deployment-awareness:topology-changed',
    resource: 'Topology',
    action: 'detected',
    condition: () => true,
    metadata: (version, state) => ({
      'topology type': state.topologyType,
      'server count': state.servers.length,
      'server types': state.servers.map(server => server.type),
      compass_version: version
    })
  },
  {
    registryEvent: 'instance-refreshed',
    resource: 'Deployment',
    action: 'detected',
    condition: (state) => (state.instance.databases !== null),
    metadata: (version, state) => ({
      'databases count': state.instance.databases.length,
      'namespaces count': state.instance.collections.length,
      'mongodb version': state.instance.build.version,
      'enterprise module': state.instance.build.enterprise_module,
      'longest database name length': Math.max(
        ...state.instance.databases.map((db) => db._id.length)),
      'longest collection name length': Math.max(
        ...state.instance.collections.map((col) => col._id.split('.')[1].length)),
      'server architecture': state.instance.host.arch,
      'server cpu cores': state.instance.host.cpu_cores,
      'server cpu frequency (mhz)': state.instance.host.cpu_frequency / 1000 / 1000,
      'server memory (gb)': state.instance.host.memory_bits / 1024 / 1024 / 1024,
      'server os': state.instance.host.os,
      'server arch': state.instance.host.arch,
      'server os family': state.instance.host.os_family,
      'server machine model': state.instance.host.machine_model,
      'server kernel version': state.instance.host.kernel_version,
      'server kernel version string': state.instance.host.kernel_version_string,
      'is genuine mongodb': state.instance.genuineMongoDB === undefined ? true : state.instance.genuineMongoDB.isGenuine,
      'server name': state.instance.genuineMongoDB === undefined ? 'mongodb' : state.instance.genuineMongoDB.dbType,
      'is data lake': state.instance.dataLake === undefined ? false : state.instance.dataLake.isDataLake,
      'data lake version': state.instance.dataLake === undefined ? null : state.instance.dataLake.version,
      is_atlas: !!state.instance._id.match(ATLAS),
      is_localhost: !!state.instance._id.match(LOCALHOST),
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:schema:schema-sampled',
    resource: 'Schema',
    action: 'sampled',
    condition: (state) => state.samplingState === 'complete',
    metadata: (version, state) => ({
      'sampling time ms': state.samplingTimeMS,
      'number of fields': state.schema.fields.length,
      'schema width': schemaStats.width(state.schema),
      'schema depth': schemaStats.depth(state.schema),
      'schema branching factors': schemaStats.branch(state.schema),
      is_geo: Object.keys(state.geo).length > 0,
      geo_layers: Object.values(state.geo).map(layer => layer.type),
      compass_version: version
    })
  },
  {
    registryEvent: 'document-deleted',
    resource: 'Document',
    action: 'deleted',
    condition: () => true,
    metadata: (version, view) => ({
      'view': view,
      compass_version: version
    })
  },
  {
    registryEvent: 'document-updated',
    resource: 'Document',
    action: 'updated',
    condition: () => true,
    metadata: (version, view, screen) => ({
      'screen': screen,
      'view': view,
      compass_version: version
    })
  },
  {
    registryEvent: 'document-inserted',
    resource: 'Document',
    action: 'inserted',
    condition: () => true,
    metadata: (version, view, mode, multiple) => ({
      'mode': mode,
      'multiple': multiple,
      'view': view,
      compass_version: version
    })
  },
  {
    registryEvent: 'document-view-changed',
    resource: 'Document',
    action: 'viewed',
    condition: () => true,
    metadata: (version, view) => ({
      'view': view,
      compass_version: version
    })
  },
  {
    registryEvent: 'documents-refreshed',
    resource: 'Documents',
    action: 'refreshed',
    condition: () => true,
    metadata: (version, view) => ({
      'view': view,
      compass_version: version
    })
  },
  {
    registryEvent: 'documents-paginated',
    resource: 'Documents',
    action: 'paginated',
    condition: () => true,
    metadata: (version, view) => ({
      'view': view,
      compass_version: version
    })
  },
  {
    registryEvent: 'schema-validation-activated',
    resource: 'SchemaValidation',
    action: 'activated',
    condition: () => true,
    metadata: (version, data) => ({
      ruleCount: data.ruleCount,
      validationLevel: data.validationLevel,
      validationAction: data.validationAction,
      jsonSchema: data.jsonSchema,
      collectionSize: data.collectionSize,
      compass_version: version
    })
  },
  {
    registryEvent: 'schema-validation-saved',
    resource: 'SchemaValidation',
    action: 'saved',
    condition: () => true,
    metadata: (version, data) => ({
      ruleCount: data.ruleCount,
      validationLevel: data.validationLevel,
      validationAction: data.validationAction,
      jsonSchema: data.jsonSchema,
      collectionSize: data.collectionSize,
      compass_version: version
    })
  },
  {
    registryEvent: 'schema-validation-rules-added',
    resource: 'SchemaValidation',
    action: 'rulesadded',
    condition: () => true,
    metadata: (version, data) => ({
      collectionSize: data.collectionSize,
      compass_version: version
    })
  },
  {
    registryEvent: 'schema-validation-fetched',
    resource: 'SchemaValidation',
    action: 'fetched',
    condition: () => true,
    metadata: (version, data) => ({
      ruleCount: data.ruleCount,
      validationLevel: data.validationLevel,
      validationAction: data.validationAction,
      jsonSchema: data.jsonSchema,
      collectionSize: data.collectionSize,
      compass_version: version
    })
  },
  {
    registryEvent: 'explain-plan-fetched',
    resource: 'Explain',
    action: 'fetched',
    condition: () => true,
    metadata: (version, data) => ({
      viewMode: data.viewMode,
      executionTimeMS: data.executionTimeMS,
      inMemorySort: data.inMemorySort,
      isCollectionScan: data.isCollectionScan,
      isCovered: data.isCovered,
      isMultiKey: data.isMultiKey,
      isSharded: data.isSharded,
      indexType: data.indexType,
      index: data.index,
      numberOfDocsReturned: data.numberOfDocsReturned,
      numberOfShards: data.numberOfShards,
      totalDocsExamined: data.totalDocsExamined,
      totalKeysExamined: data.totalKeysExamined,
      indexUsed: data.indexUsed,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:collection-stats:loaded',
    resource: 'Collection Stats',
    action: 'fetched',
    condition: (state) => (state !== undefined),
    metadata: (version, state) => ({
      'document count': state.documentCount,
      'total document size kb': state.totalDocumentSize,
      'avg document size kb': state.avgDocumentSize,
      'index count': state.indexCount,
      'total index size kb': state.totalIndexSize,
      'avg index size kb': state.avgIndexSize,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:query-bar:query-changed',
    resource: 'Query',
    action: 'applied',
    condition: (state) => state.queryState === 'apply',
    metadata: (version, state) => ({
      'filter': state.filter,
      'project': state.project,
      'sort': state.sort,
      'skip': state.skip,
      'limit': state.limit,
      compass_version: version
    })
  },
  {
    registryEvent: 'open-export',
    resource: 'Export',
    action: 'opened',
    condition: () => true,
    metadata: (version) => ({
      compass_version: version
    })
  },
  {
    registryEvent: 'export-finished',
    resource: 'Export',
    action: 'completed',
    condition: () => true,
    metadata: (version, size, fileType) => ({
      'size': size,
      'file type': fileType,
      compass_version: version
    })
  },
  {
    registryEvent: 'open-import',
    resource: 'Import',
    action: 'opened',
    condition: () => true,
    metadata: (version) => ({
      compass_version: version
    })
  },
  {
    registryEvent: 'import-finished',
    resource: 'Import',
    action: 'completed',
    condition: () => true,
    metadata: (version, size, fileType) => ({
      'size': size,
      'file type': fileType,
      compass_version: version
    })
  },
  {
    registryEvent: 'agg-pipeline-executed',
    resource: 'Aggregation',
    action: 'executed',
    condition: () => true,
    metadata: (version, data) => ({
      numStages: data.numStages,
      stageOperators: data.stageOperators,
      compass_version: version
    })
  },
  {
    registryEvent: 'agg-pipeline-saved',
    resource: 'Aggregation',
    action: 'saved',
    condition: () => true,
    metadata: (version, data) => ({
      name: data.name,
      compass_version: version
    })
  },
  {
    registryEvent: 'agg-pipeline-deleted',
    resource: 'Aggregation',
    action: 'deleted',
    condition: () => true,
    metadata: (version, data) => ({
      name: data.name,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:aggregations:update-view',
    resource: 'Aggregation',
    action: 'viewUpdated',
    condition: () => true,
    metadata: (version, data) => ({
      numStages: data.numStages,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:aggregations:create-view',
    resource: 'Aggregation',
    action: 'viewCreated',
    condition: () => true,
    metadata: (version, data) => ({
      numStages: data.numStages,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:aggregations:settings-applied',
    resource: 'Aggregation',
    action: 'settingsChanged',
    condition: () => true,
    metadata: (version, state) => ({
      ...state,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:aggregations:pipeline-imported',
    resource: 'Aggregation',
    action: 'pipelineImported',
    condition: () => true,
    metadata: (version) => ({
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:aggregations:pipeline-opened',
    resource: 'Aggregation',
    action: 'pipelineOpened',
    condition: () => true,
    metadata: (version) => ({
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:export-to-language:opened',
    resource: 'ExportToLanguage',
    action: 'opened',
    condition: () => true,
    metadata: (version, state) => ({
      source: state.source,
      compass_version: version
    })
  },
  {
    registryEvent: 'compass:export-to-language:run',
    resource: 'ExportToLanguage',
    action: 'run',
    condition: () => true,
    metadata: (version, state) => ({
      ...state,
      compass_version: version
    })
  },
  {
    registryEvent: 'tour-closed',
    resource: 'Tour',
    action: 'closed',
    condition: () => true,
    metadata: (version, title) => ({
      tab: title,
      compass_version: version
    })
  },
  {
    registryEvent: 'create-atlas-cluster-clicked',
    resource: 'AtlasLink',
    action: 'clicked',
    condition: () => true,
    metadata: (version) => ({
      compass_version: version
    })
  },
  {
    store: 'License.Store',
    resource: 'License',
    action: 'viewed',
    condition: () => true,
    metadata: (version, state) => ({
      'license accepted': state.isAgreed,
      compass_version: version
    })
  }
];

export default RULES;
