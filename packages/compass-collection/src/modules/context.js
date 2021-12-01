import React from 'react';
import { UnsafeComponent } from 'hadron-react-components';
import AppRegistry from 'hadron-app-registry';
import semver from 'semver';

/**
 * Setup scoped actions for a plugin.
 *
 * @param {Object} role - The role.
 * @param {Object} localAppRegistry - The scoped app registry to the collection.
 *
 * @returns {Object} The configured actions.
 */
const setupActions = (role, localAppRegistry) => {
  const actions = role.configureActions();
  localAppRegistry.registerAction(role.actionName, actions);
  return actions;
};

/**
 * Setup a scoped store to the collection.
 *
 * @param {Object} options - The plugin store options.
 * @property {Object} options.role - The role.
 * @property {Object} options.globalAppRegistry - The global app registry.
 * @property {Object} options.localAppRegistry - The scoped app registry to the collection.
 * @property {Object} options.dataService - The data service.
 * @property {String} options.namespace - The namespace.
 * @property {String} options.serverVersion - The server version.
 * @property {Boolean} options.isReadonly - If the collection is a readonly view.
 * @property {Object} options.actions - The actions for the store.
 * @property {Boolean} options.allowWrites - If writes are allowed.
 * @property {String} options.sourceName - The source namespace for the view.
 * @property {String} options.editViewName - The name of the view we are editing.
 *
 * @returns {Object} The configured store.
 */
const setupStore = ({
  role,
  globalAppRegistry,
  localAppRegistry,
  dataService,
  namespace,
  serverVersion,
  isReadonly,
  isTimeSeries,
  actions,
  allowWrites,
  sourceName,
  editViewName,
  sourcePipeline
}) => {
  const store = role.configureStore({
    localAppRegistry: localAppRegistry,
    globalAppRegistry: globalAppRegistry,
    dataProvider: {
      error: dataService.error,
      dataProvider: dataService.dataService
    },
    namespace: namespace,
    serverVersion: serverVersion,
    isReadonly: isReadonly,
    isTimeSeries,
    actions: actions,
    allowWrites: allowWrites,
    sourceName: sourceName,
    editViewName: editViewName,
    sourcePipeline: sourcePipeline
  });
  localAppRegistry.registerStore(role.storeName, store);

  return store;
};

/**
 * Setup a scoped plugin to the tab.
 *
 * @param {Object} options - The plugin options.
 * @property {Object} options.role - The role.
 * @property {Object} options.globalAppRegistry - The global app registry.
 * @property {Object} options.localAppRegistry - The scoped app registry to the collection.
 * @property {Object} options.dataService - The data service.
 * @property {String} options.namespace - The namespace.
 * @property {String} options.serverVersion - The server version.
 * @property {Boolean} options.isReadonly - If the collection is a readonly view.
 * @property {Boolean} options.isTimeSeries - If the collection is a time-series collection.
 * @property {Boolean} options.allowWrites - If writes are allowed.
 * @property {String} options.key - The plugin key.
 *
 * @returns {Component} The plugin.
 */
const setupPlugin = ({
  role,
  globalAppRegistry,
  localAppRegistry,
  dataService,
  namespace,
  serverVersion,
  isReadonly,
  isTimeSeries,
  sourceName,
  allowWrites,
  key
}) => {
  const actions = role.configureActions();
  const store = setupStore({
    role,
    globalAppRegistry,
    localAppRegistry,
    dataService,
    namespace,
    serverVersion,
    isReadonly,
    isTimeSeries,
    sourceName,
    actions,
    allowWrites
  });
  const plugin = role.component;
  return {
    component: plugin,
    store: store,
    actions: actions,
    key: key
  };
};

/**
 * Setup every scoped modal role.
 *
 * @param {Object} options - The scope modal plugin options.
 * @property {Object} options.globalAppRegistry - The global app registry.
 * @property {Object} options.localAppRegistry - The scoped app registry to the collection.
 * @property {Object} options.dataService - The data service.
 * @property {String} options.namespace - The namespace.
 * @property {String} options.serverVersion - The server version.
 * @property {Boolean} options.isReadonly - If the collection is a readonly view.
 * @property {Boolean} options.isTimeSeries - If the collection is a time-series.
 * @property {Boolean} options.allowWrites - If we allow writes.
 *
 * @returns {Array} The components.
 */
const setupScopedModals = ({
  globalAppRegistry,
  localAppRegistry,
  dataService,
  namespace,
  serverVersion,
  isReadonly,
  isTimeSeries,
  sourceName,
  allowWrites
}) => {
  const roles = globalAppRegistry.getRole('Collection.ScopedModal');
  if (roles) {
    return roles.map((role, i) => {
      return setupPlugin({
        role,
        globalAppRegistry,
        localAppRegistry,
        dataService,
        namespace,
        serverVersion,
        isReadonly,
        isTimeSeries,
        sourceName,
        allowWrites,
        key: i
      });
    });
  }
  return [];
};

/**
 * Create the context in which a tab is created.
 *
 * @param {Object} options - The options for creating the context.
 * @property {Object} options.state - The store state.
 * @property {String} options.namespace - The namespace.
 * @property {Boolean} options.isReadonly - Is the namespace readonly.
 * @property {Boolean} options.isDataLake - If we are hitting the data lake.
 * @property {String} options.sourceName - The name of the view source.
 * @property {String} options.editViewName - The name of the view we are editing.
 * @property {String} options.sourcePipeline
 *
 * @returns {Object} The tab context.
 */
const createContext = ({
  state,
  namespace,
  isReadonly,
  isTimeSeries,
  isDataLake,
  sourceName,
  editViewName,
  sourcePipeline
}) => {
  const serverVersion = state.serverVersion;
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = state.appRegistry;
  const roles = globalAppRegistry.getRole('Collection.Tab') || [];

  // Filter roles for feature support in the server.
  const filteredRoles = roles.filter((role) => {
    if (['Indexes', 'Validation', 'Explain Plan'].includes(role.name) && isDataLake) {
      return true;
    }
    if (!role.minimumServerVersion) return true;
    return semver.gte(serverVersion, role.minimumServerVersion);
  });

  const tabs = [];
  const views = [];
  const queryHistoryIndexes = [];

  // Setup the query bar plugin. Need to instantiate the store and actions
  // and put them in the app registry for use by all the plugins. This way
  // there is only 1 query bar store per collection tab instead of one per
  // plugin that uses it.
  const queryBarRole = globalAppRegistry.getRole('Query.QueryBar')[0];
  localAppRegistry.registerRole('Query.QueryBar', queryBarRole);
  const queryBarActions = setupActions(queryBarRole, localAppRegistry);
  setupStore({
    role: queryBarRole,
    globalAppRegistry,
    localAppRegistry,
    dataService: state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    isTimeSeries,
    actions: queryBarActions,
    allowWrites: !isDataLake
  });

  // Setup each of the tabs inside the collection tab. They will all get
  // passed the same information and can determine whether they want to
  // use it or not.
  filteredRoles.forEach((role, i) => {
    const actions = setupActions(role, localAppRegistry);
    const store = setupStore({
      role,
      globalAppRegistry,
      localAppRegistry,
      dataService: state.dataService,
      namespace,
      serverVersion,
      isReadonly,
      isTimeSeries,
      actions,
      allowWrite: !isDataLake,
      sourceName,
      editViewName,
      sourcePipeline
    });

    // Add the tab.
    tabs.push(role.name);

    // Add to query history indexes if needed.
    if (role.hasQueryHistory) {
      queryHistoryIndexes.push(i);
    }

    // Add the view.
    views.push(<UnsafeComponent component={role.component} key={i} store={store} actions={actions} />);
  });

  const statsRole = globalAppRegistry.getRole('Collection.HUD')[0];
  const statsPlugin = statsRole.component;
  const statsStore = setupStore({
    role: statsRole,
    globalAppRegistry,
    localAppRegistry,
    dataService: state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    isTimeSeries,
    sourceName,
    actions: {},
    allowWrites: !isDataLake,
    isEditing: Boolean(editViewName)
  });

  // Setup the scoped modals
  const scopedModals = setupScopedModals({
    globalAppRegistry,
    localAppRegistry,
    dataService: state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    isTimeSeries,
    sourceName,
    allowWrites: !isDataLake
  });

  const configureFieldStore = globalAppRegistry.getStore('Field.Store');
  configureFieldStore({
    localAppRegistry: localAppRegistry,
    globalAppRegistry: globalAppRegistry,
    namespace: namespace,
    serverVersion: serverVersion
  });

  return {
    tabs: tabs,
    views: views,
    queryHistoryIndexes: queryHistoryIndexes,
    statsPlugin: statsPlugin,
    statsStore: statsStore,
    scopedModals: scopedModals,
    localAppRegistry: localAppRegistry,
    sourcePipeline: sourcePipeline
  };
};

export default createContext;
