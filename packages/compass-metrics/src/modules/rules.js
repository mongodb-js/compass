import schemaStats from 'mongodb-schema/lib/stats';

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
    store: 'Schema.Store',
    resource: 'Schema',
    action: 'sampled',
    condition: (state) => state.samplingState === 'complete',
    metadata: (state) => ({
      'sampling time ms': state.samplingTimeMS,
      'number of fields': state.schema.fields.length,
      'schema width': schemaStats.width(state.schema),
      'schema depth': schemaStats.depth(state.schema),
      'schema branching factors': schemaStats.branch(state.schema)
    })
  },
  {
    store: 'DeploymentAwareness.Store',
    resource: 'Topology',
    action: 'detected',
    condition: () => true,
    metadata: (state) => ({
      'topology type': state.topologyType,
      'server count': state.servers.length,
      'server types': state.servers.map(server => server.type)
    })
  },
  {
    store: 'CollectionStats.Store',
    resource: 'Collection Stats',
    action: 'fetched',
    condition: (state) => (state !== undefined),
    metadata: (state) => ({
      'document count': state.documentCount,
      'total document size kb': state.totalDocumentSize,
      'avg document size kb': state.avgDocumentSize,
      'index count': state.indexCount,
      'total index size kb': state.totalIndexSize,
      'avg index size kb': state.avgIndexSize
    })
  },
  {
    store: 'Indexes.LoadIndexesStore',
    resource: 'Indexes',
    action: 'fetched',
    condition: () => true,
    multi: true,
    metadata: (state) => ({
      'index type': state.type,
      'usage count': state.usageCount,
      'cardinality': state.cardinality,
      'properties': state.properties
    })
  },
  {
    store: 'Query.QueryStore',
    resource: 'Query',
    action: 'applied',
    condition: (state) => state.queryState === 'apply',
    metadata: (state) => ({
      'filter': state.filter,
      'project': state.project,
      'sort': state.sort,
      'skip': state.skip,
      'limit': state.limit
    })
  },
  {
    store: 'Home.HomeStore',
    resource: 'Application',
    action: 'connected',
    condition: (state) => state.isConnected === true,
    metadata: (state) => ({
      'is atlas': state.isAtlas,
      'authentication method': state.authentication,
      'ssl method': state.ssl,
      'ssh tunnel method': state.sshTunnel
    })
  },
  {
    store: 'Validation.Store',
    resource: 'Validation Rules',
    action: 'fetched',
    condition: () => true,
    metadata: (state) => ({
      'rule count': state.validationRules.length,
      'validation level': state.validationLevel,
      'validation action': state.validationAction
    })
  },
  {
    store: 'Explain.Store',
    resource: 'Explain',
    action: 'fetched',
    condition: () => true,
    metadata: (state) => ({
      'view mode': state.viewType,
      'execution time ms': state.executionTimeMillis,
      'in memory sort': state.inMemorySort,
      'is collection scan': state.isCollectionScan,
      'is covered': state.isCovered,
      'is multi key': state.isMultiKey,
      'is sharded': state.isSharded,
      'index type': state.indexType,
      'index': state.index ? state.index.serialize() : null,
      'number of docs returned': state.nReturned,
      'number of shards': state.numShards,
      'total docs examined': state.totalDocsExamined,
      'total keys examined': state.totalKeysExamined,
      'index used': state.usedIndex
    })
  },
  {
    registryEvent: 'instance-refreshed',
    resource: 'Deployment',
    action: 'detected',
    condition: (state) => (state.instance.databases !== null),
    metadata: (state) => ({
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
      'server kernel version string': state.instance.host.kernel_version_string
    })
  },
  {
    registryEvent: 'open-export',
    resource: 'Export',
    action: 'opened',
    condition: () => true,
    metadata: () => ({})
  },
  {
    registryEvent: 'export-finished',
    resource: 'Export',
    action: 'completed',
    condition: () => true,
    metadata: (size, fileType) => ({
      'size': size,
      'file type': fileType
    })
  },
  {
    registryEvent: 'open-import',
    resource: 'Import',
    action: 'opened',
    condition: () => true,
    metadata: () => ({})
  },
  {
    registryEvent: 'import-finished',
    resource: 'Import',
    action: 'completed',
    condition: () => true,
    metadata: (size, fileType) => ({
      'size': size,
      'file type': fileType
    })
  },
  {
    registryEvent: 'document-deleted',
    resource: 'Document',
    action: 'deleted',
    condition: () => true,
    metadata: (view) => ({
      'view': view
    })
  },
  {
    registryEvent: 'document-updated',
    resource: 'Document',
    action: 'updated',
    condition: () => true,
    metadata: (view) => ({
      'view': view
    })
  },
  {
    registryEvent: 'document-inserted',
    resource: 'Document',
    action: 'inserted',
    condition: () => true,
    metadata: (view) => ({
      'view': view
    })
  },
  {
    registryEvent: 'documents-refreshed',
    resource: 'Documents',
    action: 'refreshed',
    condition: () => true,
    metadata: (view) => ({
      'view': view
    })
  },
  {
    registryEvent: 'documents-paginated',
    resource: 'Documents',
    action: 'paginated',
    condition: () => true,
    metadata: (view) => ({
      'view': view
    })
  },
  {
    registryEvent: 'create-atlas-cluster-clicked',
    resource: 'AtlasLink',
    action: 'clicked',
    condition: () => true,
    metadata: () => ({})
  },
  {
    registryEvent: 'agg-pipeline-executed',
    resource: 'Aggregation',
    action: 'executed',
    condition: () => true,
    metadata: (data) => ({
      numStages: data.numStages,
      stageOperators: data.stageOperators
    })
  },
  {
    registryEvent: 'schema-validation-fetched',
    resource: 'SchemaValidation',
    action: 'fetched',
    condition: () => true,
    metadata: (data) => ({
      ruleCount: data.ruleCount,
      validationLevel: data.validationLevel,
      validationAction: data.validationAction,
      jsonSchema: data.jsonSchema,
      collectionSize: data.collectionSize
    })
  },
  {
    registryEvent: 'schema-validation-activated',
    resource: 'SchemaValidation',
    action: 'activated',
    condition: () => true,
    metadata: (data) => ({
      ruleCount: data.ruleCount,
      validationLevel: data.validationLevel,
      validationAction: data.validationAction,
      jsonSchema: data.jsonSchema,
      collectionSize: data.collectionSize
    })
  },
  {
    registryEvent: 'schema-validation-saved',
    resource: 'SchemaValidation',
    action: 'saved',
    condition: () => true,
    metadata: (data) => ({
      ruleCount: data.ruleCount,
      validationLevel: data.validationLevel,
      validationAction: data.validationAction,
      jsonSchema: data.jsonSchema,
      collectionSize: data.collectionSize
    })
  },
  {
    registryEvent: 'schema-validation-rules-added',
    resource: 'SchemaValidation',
    action: 'rulesadded',
    condition: () => true,
    metadata: (data) => ({ collectionSize: data.collectionSize })
  },
  {
    registryEvent: 'agg-pipeline-saved',
    resource: 'Aggregation',
    action: 'saved',
    condition: () => true,
    metadata: (data) => ({
      name: data.name
    })
  },
  {
    registryEvent: 'agg-pipeline-deleted',
    resource: 'Aggregation',
    action: 'deleted',
    condition: () => true,
    metadata: (data) => ({
      name: data.name
    })
  },
  {
    store: 'License.Store',
    resource: 'License',
    action: 'viewed',
    condition: () => true,
    metadata: (state) => ({
      'license accepted': state.isAgreed
    })
  }
];

export default RULES;
