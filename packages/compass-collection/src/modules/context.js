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
 * @param {Object} role - The role.
 * @param {Object} globalAppRegistry - The global app registry.
 * @param {Object} localAppRegistry - The scoped app registry to the collection.
 * @param {Object} dataService - The data service.
 * @param {String} namespace - The namespace.
 * @param {String} serverVersion - The server version.
 * @param {Boolean} isReadonly - If the collection is a readonly view.
 * @param {Object} actions - The actions for the store.
 * @param {Boolean} allowWrites - If writes are allowed.
 * @param {String} sourceName - The source namespace for the view.
 * @param {String} editViewName - The name of the view we are editing.
 *
 * @returns {Object} The configured store.
 */
const setupStore = (
  role,
  globalAppRegistry,
  localAppRegistry,
  dataService,
  namespace,
  serverVersion,
  isReadonly,
  actions,
  allowWrites,
  sourceName,
  editViewName,
  sourcePipeline) => {
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
 * @param {Object} role - The role.
 * @param {Object} globalAppRegistry - The global app registry.
 * @param {Object} localAppRegistry - The scoped app registry to the collection.
 * @param {Object} dataService - The data service.
 * @param {String} namespace - The namespace.
 * @param {String} serverVersion - The server version.
 * @param {Boolean} isReadonly - If the collection is a readonly view.
 * @param {Boolean} allowWrites - If writes are allowed.
 * @param {String} key - The plugin key.
 *
 * @returns {Component} The plugin.
 */
const setupPlugin = (
  role,
  globalAppRegistry,
  localAppRegistry,
  dataService,
  namespace,
  serverVersion,
  isReadonly,
  allowWrites,
  key) => {
  const actions = role.configureActions();
  const store = setupStore(
    role,
    globalAppRegistry,
    localAppRegistry,
    dataService,
    namespace,
    serverVersion,
    isReadonly,
    actions,
    allowWrites
  );
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
 * @param {Object} globalAppRegistry - The global app registry.
 * @param {Object} localAppRegistry - The scoped app registry to the collection.
 * @param {Object} dataService - The data service.
 * @param {String} namespace - The namespace.
 * @param {String} serverVersion - The server version.
 * @param {Boolean} isReadonly - If the collection is a readonly view.
 * @param {Boolean} allowWrites - If we allow writes.
 *
 * @returns {Array} The components.
 */
const setupScopedModals = (
  globalAppRegistry,
  localAppRegistry,
  dataService,
  namespace,
  serverVersion,
  isReadonly,
  allowWrites) => {
  const roles = globalAppRegistry.getRole('Collection.ScopedModal');
  if (roles) {
    return roles.map((role, i) => {
      return setupPlugin(
        role,
        globalAppRegistry,
        localAppRegistry,
        dataService,
        namespace,
        serverVersion,
        isReadonly,
        allowWrites,
        i
      );
    });
  }
  return [];
};

/**
 * Create the context in which a tab is created.
 *
 * @param {Object} state - The store state.
 * @param {String} namespace - The namespace.
 * @param {Boolean} isReadonly - Is the namespace readonly.
 * @param {Boolean} isDataLake - If we are hitting the data lake.
 * @param {String} sourceName - The name of the view source.
 * @param {String} editViewName - The name of the view we are editing.
 *
 * @returns {Object} The tab context.
 */
const createContext = (state, namespace, isReadonly, isDataLake, sourceName, editViewName, sourcePipeline) => {
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
  setupStore(
    queryBarRole,
    globalAppRegistry,
    localAppRegistry,
    state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    queryBarActions,
    !isDataLake
  );

  // Setup each of the tabs inside the collection tab. They will all get
  // passed the same information and can determine whether they want to
  // use it or not.
  filteredRoles.forEach((role, i) => {
    const actions = setupActions(role, localAppRegistry);
    const store = setupStore(
      role,
      globalAppRegistry,
      localAppRegistry,
      state.dataService,
      namespace,
      serverVersion,
      isReadonly,
      actions,
      !isDataLake,
      sourceName,
      editViewName,
      sourcePipeline
    );

    // Add the tab.
    tabs.push(role.name);

    // Add to query history indexes if needed.
    if (role.hasQueryHistory) {
      queryHistoryIndexes.push(i);
    }

    // Add the view.
    views.push(<UnsafeComponent component={role.component} key={i} store={store} actions={actions} />);
  });

  // Setup the stats in the collection HUD
  const statsRole = globalAppRegistry.getRole('Collection.HUD')[0];
  const statsPlugin = statsRole.component;
  const statsStore = setupStore(
    statsRole,
    globalAppRegistry,
    localAppRegistry,
    state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    {},
    !isDataLake
  );

  // Setup the scoped modals
  const scopedModals = setupScopedModals(
    globalAppRegistry,
    localAppRegistry,
    state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    !isDataLake
  );

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
