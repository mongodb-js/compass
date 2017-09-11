const schemaStats = require('mongodb-schema/lib/stats');
const debug = require('debug')('mongodb-compass:metrics:rules');

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
module.exports = [
  {
    store: 'App.InstanceStore',
    resource: 'Deployment',
    action: 'detected',
    condition: () => true,
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
      'server memory size (gb)': state.instance.host.memory_bits / 1024 / 1024 / 1024
    })
  },
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
  }

];
