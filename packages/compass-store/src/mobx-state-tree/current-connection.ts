import type { Instance } from 'mobx-state-tree';
import { flow, toGenerator } from 'mobx-state-tree';
import { types } from 'mobx-state-tree';
import type { ConnectionOptions } from 'mongodb-data-service';
import { useCallback } from 'react';
import { LoadableModel, getServices } from '../util';
import { useRootStoreContext } from './root-store-context';

export const CurrentConnectionModel = types
  .compose(
    'CurrentConnection',
    LoadableModel,
    types.model({
      connectionString: types.maybeNull(types.string),
    })
  )
  .actions((self) => {
    const connect = flow(function* (connectionOptions: ConnectionOptions) {
      self.status = 'Fetching';
      try {
        const { dataServiceManager } = getServices(self);
        const ds = yield* toGenerator(
          dataServiceManager.connect(connectionOptions)
        );
        self.status = 'Ready';
        self.connectionString = ds.getConnectionString().toString();
        return ds;
      } catch (err) {
        self.status = 'Error';
        self.error = (err as Error).message;
        throw err;
      }
    });

    return { connect };
  });

export type CurrentConnection = Instance<typeof CurrentConnectionModel>;

// TODO: This is really really nasty to return dataService directly here but
// based on how connection form works there is no other way to wire things up
// without a refactor (that we should do, but I'm omitting for the PoC)
export const useConnect = () => {
  const { currentConnection } = useRootStoreContext();
  return useCallback((connectionOptions: ConnectionOptions) => {
    return currentConnection.connect(connectionOptions);
  }, []);
};
