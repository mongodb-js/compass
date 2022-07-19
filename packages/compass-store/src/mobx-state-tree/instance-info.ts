import type { Instance } from 'mobx-state-tree';
import type { InstanceDetails } from 'mongodb-data-service';
import { flow, toGenerator } from 'mobx-state-tree';
import { types } from 'mobx-state-tree';
import { useEffect } from 'react';
import {
  LoadableModel,
  shouldFetch,
  getServices,
  debounceInflight,
} from '../util';
import { useRootStoreContext } from './root-store-context';

export const MongoDBInstanceInfoModel = types
  .compose(
    'MongoDBInstanceInfo',
    LoadableModel,
    types.model({
      data: types.maybeNull(types.frozen<InstanceDetails>()),
    })
  )
  .actions((self) => {
    const fetch = debounceInflight(
      flow(function* () {
        if (!shouldFetch(self.status)) {
          return;
        }
        self.status = self.status === 'Initial' ? 'Fetching' : 'Refreshing';
        try {
          const { dataServiceManager } = getServices(self);
          const ds = yield* toGenerator(
            dataServiceManager.getCurrentConnection()
          );
          const instance = yield* toGenerator(ds.instance());
          self.data = instance;
        } catch (err) {
          self.status = 'Error';
          self.error = (err as Error).message;
          throw err;
        }
      })
    );

    return { fetch };
  });

export type MongoDBInstanceInfo = Instance<typeof MongoDBInstanceInfoModel>;

export const useMongoDBInstanceInfo = () => {
  const { instance } = useRootStoreContext();
  useEffect(() => {
    void instance.fetch();
  }, []);
  return instance;
};
