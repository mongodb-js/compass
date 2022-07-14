import React from 'react';
import AppRegistry from 'hadron-app-registry';
import semver from 'semver';
import { ErrorBoundary } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { Document } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import ConnectionString from 'mongodb-connection-string-url';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:compass-collection:context'
);

// TODO: replace this with state coming from the right layer.
// this kind of information should not be derived
// from dataService as it operates on a lower level,
// as a consequence here we have to remove the `appName` that only
// the dataService should be using.
function getCurrentlyConnectedUri(dataService: DataService) {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(
      dataService.getConnectionOptions().connectionString
    );
  } catch (e) {
    return '<uri>';
  }

  if (
    /^mongodb compass/i.exec(
      connectionStringUrl.searchParams.get('appName') || ''
    )
  ) {
    connectionStringUrl.searchParams.delete('appName');
  }

  return connectionStringUrl.href;
}

/**
 * Setup scoped actions for a plugin.
 *
 * @param {Object} role - The role.
 * @param {Object} localAppRegistry - The scoped app registry to the collection.
 *
 * @returns {Object} The configured actions.
 */
const setupActions = (role: any, localAppRegistry: AppRegistry) => {
  const actions = role.configureActions();
  localAppRegistry.registerAction(role.actionName, actions);
  return actions;
};

type ContextProps = {
  tabs?: string[];
  views?: JSX.Element[];
  role?: any;
  globalAppRegistry?: AppRegistry;
  localAppRegistry?: AppRegistry;
  dataService?: any;
  namespace?: string;
  serverVersion?: string;
  isReadonly?: boolean;
  isTimeSeries?: boolean;
  isClustered?: boolean;
  isFLE?: boolean;
  actions?: any;
  sourceName?: string;
  editViewName?: string;
  sourcePipeline?: Document[];
  query?: any;
  aggregation?: any;
  key?: number;
  state?: any;
  isDataLake?: boolean;
  queryHistoryIndexes?: number[];
  scopedModals?: any[];
  connectionString?: string;
};

type ContextWithAppRegistry = ContextProps & {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
}

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
  isDataLake,
  isClustered,
  isFLE,
  actions,
  sourceName,
  editViewName,
  sourcePipeline,
  query,
  aggregation,
  connectionString,
}: ContextWithAppRegistry) => {
  const store = role.configureStore({
    localAppRegistry,
    globalAppRegistry,
    dataProvider: {
      error: dataService?.error,
      dataProvider: dataService?.dataService,
    },
    namespace,
    serverVersion,
    isReadonly,
    isTimeSeries,
    isDataLake,
    isClustered,
    isFLE,
    actions: actions,
    sourceName,
    editViewName,
    sourcePipeline,
    query,
    aggregation,
    connectionString,
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
 * @property {Boolean} options.isClustered - If the collection is a clustered index collection.
 * @property {Boolean} options.isFLE - If the collection is a FLE collection.
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
  isDataLake,
  isClustered,
  isFLE,
  sourceName,
  connectionString,
  key,
}: ContextWithAppRegistry) => {
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
    isDataLake,
    isClustered,
    isFLE,
    sourceName,
    actions,
    connectionString,
  });
  const plugin = role.component;
  return {
    component: plugin,
    store: store,
    actions: actions,
    key: key,
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
 * @property {Boolean} options.isClustered - If the collection is a time-series.
 * @property {Boolean} options.isFLE - If the collection is a FLE collection.
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
  isDataLake,
  isClustered,
  isFLE,
  sourceName,
  connectionString,
}: ContextWithAppRegistry) => {
  const roles = globalAppRegistry?.getRole('Collection.ScopedModal');
  if (roles) {
    return roles.map((role: any, i: number) => {
      return setupPlugin({
        role,
        globalAppRegistry,
        localAppRegistry,
        dataService,
        namespace,
        serverVersion,
        isReadonly,
        isTimeSeries,
        isDataLake,
        isClustered,
        isFLE,
        sourceName,
        connectionString,
        key: i,
      });
    });
  }
  return [];
};

/**
 * Setup the query bar plugins. Need to instantiate the store and actions
 * and put them in the app registry for use by all the plugins. This way
 * there is only 1 query bar store per collection tab instead of one per
 * plugin that uses it.
 *
 * @param {Object} options - The scope modal plugin options.
 * @property {Object} options.globalAppRegistry - The global app registry.
 * @property {Object} options.localAppRegistry - The scoped app registry to the collection.
 * @property {Object} options.dataService - The data service.
 * @property {String} options.namespace - The namespace.
 * @property {String} options.serverVersion - The server version.
 * @property {Boolean} options.isReadonly - If the collection is a readonly view.
 * @property {Boolean} options.isTimeSeries - If the collection is a time-series.
 * @property {Boolean} options.isClustered - If the collection is a time-series.
 * @property {Boolean} options.isFLE - If the collection is a FLE collection.
 *
 * @returns {Array} The components.
 */
const setupQueryPlugins = ({
  globalAppRegistry,
  localAppRegistry,
  serverVersion,
  state,
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  query,
  aggregation,
}: ContextWithAppRegistry) => {
  const queryBarRole = globalAppRegistry.getRole('Query.QueryBar')![0];
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
    isClustered,
    isFLE,
    actions: queryBarActions,
    query,
    aggregation,
  });

  const queryHistoryRole = globalAppRegistry.getRole('Query.QueryHistory')![0];
  localAppRegistry.registerRole('Query.QueryHistory', queryHistoryRole);
  const queryHistoryActions = setupActions(queryHistoryRole, localAppRegistry);
  setupStore({
    role: queryHistoryRole,
    globalAppRegistry,
    localAppRegistry,
    dataService: state.dataService,
    namespace,
    serverVersion,
    isReadonly,
    isTimeSeries,
    isClustered,
    isFLE,
    actions: queryHistoryActions,
    query,
    aggregation,
  });
}

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
  isClustered,
  isFLE,
  isDataLake,
  sourceName,
  editViewName,
  sourcePipeline,
  query,
  aggregation,
}: ContextProps): ContextProps => {
  const serverVersion = state.serverVersion;
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = state.appRegistry;
  const roles = globalAppRegistry.getRole('Collection.Tab') || [];

  // Filter roles for feature support in the server.
  const filteredRoles = roles.filter((role: any) => {
    if (
      ['Indexes', 'Validation', 'Explain Plan'].includes(role.name) &&
      isDataLake
    ) {
      return true;
    }
    if (!role.minimumServerVersion) return true;
    return semver.gte(serverVersion, role.minimumServerVersion);
  });

  const tabs: any[] = [];
  const views: JSX.Element[] = [];
  const queryHistoryIndexes: number[] = [];

  setupQueryPlugins({
    globalAppRegistry,
    localAppRegistry,
    serverVersion,
    state,
    namespace,
    isReadonly,
    isTimeSeries,
    isClustered,
    isFLE,
    query,
    aggregation,
  });

  // Setup each of the tabs inside the collection tab. They will all get
  // passed the same information and can determine whether they want to
  // use it or not.
  filteredRoles.forEach((role: any, i: number) => {
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
      isDataLake,
      isClustered,
      isFLE,
      actions,
      sourceName,
      editViewName,
      sourcePipeline,
      query,
      aggregation,
    });

    // Add the tab.
    tabs.push(role.name);

    // Add to query history indexes if needed.
    if (role.hasQueryHistory) {
      queryHistoryIndexes.push(i);
    }

    const tabProps = {
      store,
      actions,
      ...(role.name === 'Aggregations' && {
        showExportButton: true,
        showRunButton: true,
        showExplainButton: true,
      }),
    };

    // Add the view.
    views.push(
      <ErrorBoundary
        key={i}
        displayName={role.component.displayName}
        onError={(error, errorInfo) => {
          log.error(
            mongoLogId(1001000107),
            'Collection Workspace',
            'Rendering collection tab failed',
            { name: role.name, error: error.message, errorInfo }
          );
        }}
      >
        <role.component {...tabProps} />
      </ErrorBoundary>
    );
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
    isDataLake,
    isClustered,
    isFLE,
    sourceName,
    connectionString: getCurrentlyConnectedUri(state.dataService.dataService),
  });

  const configureFieldStore = globalAppRegistry.getStore('Field.Store');
  configureFieldStore({
    localAppRegistry: localAppRegistry,
    globalAppRegistry: globalAppRegistry,
    namespace: namespace,
    serverVersion: serverVersion,
  });

  return {
    tabs,
    views,
    queryHistoryIndexes,
    scopedModals,
    localAppRegistry,
    sourcePipeline,
  };
};

export default createContext;
