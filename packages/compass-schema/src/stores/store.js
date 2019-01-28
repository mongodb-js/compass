import { createStore } from 'redux';
import reducer from 'modules';

const store = createStore(reducer);

/*
store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:

  appRegistry.on('application-intialized', (version) => {
    // Version is string in semver format, ex: "1.10.0"
  });

  appRegistry.on('data-service-intialized', (dataService) => {
    // dataService is not yet connected. Can subscribe to events.
    // DataService API: https://github.com/mongodb-js/data-service/blob/master/lib/data-service.js
  });

  appRegistry.on('data-service-connected', (error, dataService) => {
    // dataService is connected or errored.
    // DataService API: https://github.com/mongodb-js/data-service/blob/master/lib/data-service.js
  });

  appRegistry.on('collection-changed', (namespace) => {
    // The collection has changed - provides the current namespace.
    // Namespace format: 'database.collection';
    // Collection selected: 'database.collection';
    // Database selected: 'database';
    // Instance selected: '';
  });

  appRegistry.on('database-changed', (namespace) => {
    // The database has changed.
    // Namespace format: 'database.collection';
    // Collection selected: 'database.collection';
    // Database selected: 'database';
    // Instance selected: '';
  });

  appRegistry.on('query-applied', (queryState) => {
    // The query has changed and the user has clicked "filter" or "reset".
    // queryState format example:
    //   {
    //     filter: { name: 'testing' },
    //     project: { name: 1 },
    //     sort: { name: -1 },
    //     skip: 0,
    //     limit: 20,
    //     ns: 'database.collection'
    //   }
  });
};
*/

export default store;
