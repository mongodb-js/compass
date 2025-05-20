import {
  dataServiceLocator,
  useConnectionInfo,
} from '@mongodb-js/compass-connections/provider';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';
import type { MongoDBInstanceProps } from './models/instance';
import { MongoDBInstance } from './models/instance';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MongoDBInstancesManager } from './instances-manager';
import toNS from 'mongodb-ns';
import type Collection from './models/collection';
import type Database from './models/database';
import type {
  AllPreferences,
  PreferencesAccess,
} from 'compass-preferences-model';

export {
  MongoDBInstancesManagerEvents,
  type MongoDBInstancesManager,
} from './instances-manager';

/**
 * Exported only for testing purposes. Allows to set up a MongoDBInstanceManager
 * with preconfigured MongoDBInstance
 *
 * @internal
 */
export class TestMongoDBInstanceManager extends MongoDBInstancesManager {
  private _instance: MongoDBInstance;
  constructor(instanceProps = {} as Partial<MongoDBInstanceProps>) {
    super();
    if (!instanceProps.preferences) {
      instanceProps.preferences = {
        getPreferences: () => ({} as AllPreferences),
        setPreferences: () => Promise.resolve(),
        onPreferenceValueChanged: () => () => {
          /* no-op */
        },
      } as unknown as PreferencesAccess;
    }
    this._instance = new MongoDBInstance(instanceProps as MongoDBInstanceProps);
  }
  getMongoDBInstanceForConnection() {
    return this._instance;
  }
  createMongoDBInstanceForConnection() {
    return this._instance;
  }
}

// We need to create the context with a proper mock for testing
// that includes default preferences
export const MongoDBInstancesManagerContext =
  createContext<MongoDBInstancesManager | null>(
    process.env.NODE_ENV === 'test'
      ? (new TestMongoDBInstanceManager() as unknown as MongoDBInstancesManager)
      : null
  );

export const MongoDBInstancesManagerProvider =
  MongoDBInstancesManagerContext.Provider;

export const mongoDBInstancesManagerLocator = createServiceLocator(
  function useMongoDBInstanceManager(): MongoDBInstancesManager {
    const instancesManager = useContext(MongoDBInstancesManagerContext);
    if (!instancesManager) {
      throw new Error(
        'No MongoDBInstancesManager available in this context, provider was not setup correctly'
      );
    }
    return instancesManager;
  },
  'mongoDBInstancesManagerLocator'
);

export const mongoDBInstanceLocator = createServiceLocator(
  function useMongoDBInstance(): MongoDBInstance {
    const connectionInfo = useConnectionInfo();
    const instancesManager = mongoDBInstancesManagerLocator();
    return instancesManager.getMongoDBInstanceForConnection(connectionInfo.id);
  },
  'mongoDBInstanceLocator'
);

const NamespaceModelContext = React.createContext<Database | Collection | null>(
  null
);

export const databaseModelLocator = createServiceLocator(
  function useDatabaseModel(this: void) {
    const model = useContext(NamespaceModelContext);
    if (!model || model.modelType !== 'Database') {
      const got = model ? 'Collection model' : 'undefined';
      throw new Error(
        `Tried to locate Database model, but got ${got} instead. Are you trying to use databaseModelLocator outside of database namespace scope?`
      );
    }
    return model;
  },
  'databaseModelLocator'
);

export const collectionModelLocator = createServiceLocator(
  function useCollectionModel(this: void) {
    const model = useContext(NamespaceModelContext);
    if (!model || model.modelType !== 'Collection') {
      const got = model ? 'Database model' : 'undefined';
      throw new Error(
        `Tried to locate Collection model, but got ${got} instead. Are you trying to use collectionModelLocator outside of collection namespace scope?`
      );
    }
    return model;
  },
  'collectionModelLocator'
);

/**
 *
 */
export const NamespaceProvider = createServiceProvider(
  function NamespaceProvider({
    children,
    namespace,
    onNamespaceFallbackSelect,
  }: {
    children?: React.ReactNode;
    namespace: string;
    onNamespaceFallbackSelect?(namespace: string | null): void;
  }) {
    const onNamespaceFallbackSelectRef = useRef(onNamespaceFallbackSelect);
    onNamespaceFallbackSelectRef.current = onNamespaceFallbackSelect;
    const dataService = dataServiceLocator();
    const mongoDBInstance = mongoDBInstanceLocator();
    const ns = useMemo(() => {
      return toNS(namespace);
    }, [namespace]);
    const [namespaceModel, setNamespaceModel] = useState<
      Database | Collection | null
    >(() => {
      const model = ns.collection
        ? mongoDBInstance.databases.get(ns.database)?.collections.get(ns.ns)
        : mongoDBInstance.databases.get(ns.database);
      return model ?? null;
    });

    useEffect(() => {
      let cancelled = false;
      void (async () => {
        if (namespaceModel && namespaceModel._id === ns.ns) {
          return;
        }

        setNamespaceModel(null);

        await mongoDBInstance.fetchDatabases({ dataService }).catch(() => {
          // We don't care if it failed here, for us it's similar to not finding
          // the namespace
        });
        const db = mongoDBInstance.databases.get(ns.database);

        if (!db) {
          onNamespaceFallbackSelectRef.current?.(null);
          return;
        }

        if (!ns.collection) {
          if (!cancelled) {
            setNamespaceModel(db);
          }
          return;
        }

        await db.fetchCollections({ dataService }).catch(() => {
          // See above
        });
        const coll = db.collections.get(ns.ns);

        if (!coll) {
          onNamespaceFallbackSelectRef.current?.(db._id);
          return;
        }

        if (!cancelled) {
          setNamespaceModel(coll);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [
      dataService,
      mongoDBInstance,
      namespaceModel,
      ns.collection,
      ns.database,
      ns.ns,
    ]);

    if (!namespaceModel) {
      return null;
    }

    return (
      <NamespaceModelContext.Provider value={namespaceModel}>
        {children}
      </NamespaceModelContext.Provider>
    );
  }
);

export type { MongoDBInstance, Collection, Database };
