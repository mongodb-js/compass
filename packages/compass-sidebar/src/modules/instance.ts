import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootAction, SidebarThunkAction } from '.';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import throttle from 'lodash/throttle';
import { type Database, changeDatabases } from './databases';
import { changeConnectionOptions } from './connection-options';
import { setIsPerformanceTabSupported } from './is-performance-tab-supported';
import type { MongoServerError } from 'mongodb';

/**
 * Instance action.
 */
export const SETUP_INSTANCE = 'sidebar/instance/SETUP_INSTANCE' as const;
export interface SetupInstanceAction {
  type: typeof SETUP_INSTANCE;
  connectionId: ConnectionInfo['id'];
  instance: SingleInstanceState;
}

/**
 * Instance action.
 */
export const CLOSE_INSTANCE = 'sidebar/instance/CLOSE_INSTANCE' as const;
export interface CloseInstanceAction {
  type: typeof CLOSE_INSTANCE;
  connectionId: ConnectionInfo['id'];
}

/**
 * The initial state of the sidebar instance.
 */
export const INITIAL_STATE: InstanceState = {};
export type InstanceState = Record<ConnectionInfo['id'], SingleInstanceState>;
export type SingleInstanceState = null | Pick<
  MongoDBInstance,
  | 'status'
  | 'refreshingStatus'
  | 'databasesStatus'
  | 'csfleMode'
  | 'build'
  | 'dataLake'
  | 'genuineMongoDB'
  | 'topologyDescription'
  | 'isWritable'
  | 'env'
  | 'isAtlas'
  | 'isLocalAtlas'
>;
export type InstanceAction = SetupInstanceAction | CloseInstanceAction;

/**
 * Reducer function for handle state changes to sidebar instance.
 *
 * @param {String} state - The sidebar instance state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: InstanceState = INITIAL_STATE,
  action: RootAction
): InstanceState {
  if (action.type === SETUP_INSTANCE) {
    return {
      ...state,
      [action.connectionId]: action.instance,
    };
  } else if (action.type === CLOSE_INSTANCE) {
    const result = { ...state };
    delete result[action.connectionId];
    return result;
  }
  return state;
}

export const setupInstance =
  (
    connectionId: ConnectionInfo['id'],
    instance: MongoDBInstance
  ): SidebarThunkAction<void, RootAction> =>
  (dispatch, getState, { connections, logger: { log, mongoLogId } }) => {
    const { instance: instanceList } = getState();

    if (instanceList[connectionId]) {
      // We only need to track the initial set up of the instance here.
      // The reason is that any other change relevant to the instance will
      // be received through instance events.
      return;
    }

    const onInstanceChange = throttle(
      () => {
        dispatch({
          type: SETUP_INSTANCE,
          connectionId,
          instance: {
            status: instance.status,
            refreshingStatus: instance.refreshingStatus,
            databasesStatus: instance.databasesStatus,
            csfleMode: instance.csfleMode,
            build: {
              isEnterprise: instance.build.isEnterprise,
              version: instance.build.version,
            },
            dataLake: {
              isDataLake: instance.dataLake.isDataLake,
              version: instance.dataLake.version,
            },
            genuineMongoDB: {
              dbType: instance.genuineMongoDB.dbType,
              isGenuine: instance.genuineMongoDB.isGenuine,
            },
            topologyDescription: {
              servers: instance.topologyDescription.servers,
              setName: instance.topologyDescription.setName,
              type: instance.topologyDescription.type,
            },
            isWritable: instance.isWritable,
            env: instance.env,
            isAtlas: instance.isAtlas,
            isLocalAtlas: instance.isLocalAtlas,
          },
        });
      },
      300,
      { leading: true, trailing: true }
    );

    function getDatabaseInfo(db: Database) {
      return {
        _id: db._id,
        name: db.name,
        collectionsStatus: db.collectionsStatus,
        collectionsLength: db.collectionsLength,
      };
    }

    function getCollectionInfo(coll: Database['collections'][number]) {
      return {
        _id: coll._id,
        name: coll.name,
        type: coll.type,
        sourceName: coll.sourceName,
        pipeline: coll.pipeline,
      };
    }

    const onDatabasesChange = throttle(
      () => {
        const dbs = instance.databases.map((db) => {
          return {
            ...getDatabaseInfo(db),
            collections: db.collections.map((coll) => {
              return getCollectionInfo(coll);
            }),
          };
        });

        dispatch(changeDatabases(connectionId, dbs));
      },
      300,
      { leading: true, trailing: true }
    );

    instance.on('change:status', onInstanceChange);
    instance.on('change:refreshingStatus', onInstanceChange);
    instance.on('change:databasesStatus', onInstanceChange);
    instance.on('change:csfleMode', onInstanceChange);
    instance.on('change:topologyDescription', onInstanceChange);
    instance.on('change:isWritable', onInstanceChange);
    instance.on('change:env', onInstanceChange);

    instance.on('change:databasesStatus', onDatabasesChange);
    instance.on('add:databases', onDatabasesChange);
    instance.on('remove:databases', onDatabasesChange);
    instance.on('change:databases', onDatabasesChange);
    instance.on('change:databases.collectionsStatus', onDatabasesChange);

    instance.on('add:collections', onDatabasesChange);
    instance.on('remove:collections', onDatabasesChange);
    instance.on('change:collections._id', onDatabasesChange);
    instance.on('change:collections.status', onDatabasesChange);

    const dataService = connections.getDataServiceForConnection(connectionId);

    const connectionOptions = dataService.getConnectionOptions();
    dispatch(changeConnectionOptions(connectionId, connectionOptions)); // stores ssh tunnel status

    void Promise.all([dataService.currentOp(), dataService.top()]).then(
      () => {
        dispatch(setIsPerformanceTabSupported(connectionId, true));
      },
      (err) => {
        log.info(
          mongoLogId(1_001_000_278),
          'Sidebar',
          'Performance tab required commands failed',
          { error: (err as Error).message }
        );
        // Only disable performance tab if encountered Atlas error
        const isSupported =
          (err as MongoServerError).codeName === 'AtlasError' ? false : true;
        dispatch(setIsPerformanceTabSupported(connectionId, isSupported));
      }
    );

    onInstanceChange();
    onDatabasesChange();
  };

export const closeInstance =
  (connectionId: ConnectionInfo['id']): SidebarThunkAction<void, RootAction> =>
  (dispatch, getState) => {
    const { instance: instanceList } = getState();

    if (!instanceList[connectionId]) {
      // Don't do anything if we don't have the instance here.
      return;
    }

    dispatch({
      type: CLOSE_INSTANCE,
      connectionId,
    });
  };
