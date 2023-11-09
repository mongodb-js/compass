import type AppRegistry from 'hadron-app-registry';
import type { Action, AnyAction } from 'redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import {
  globalAppRegistryActivated,
  ns,
  dataService,
  globalAppRegistry,
} from '../modules/compass';
import {
  dataServiceConnected,
  dataServiceDisconnected,
} from '../modules/compass/data-service';
import { importReducer, openImport } from '../modules/import';

export function configureStore() {
  return createStore(
    combineReducers({
      import: importReducer,
      ns,
      dataService,
      globalAppRegistry,
    }),
    applyMiddleware(thunk)
  );
}

export type RootImportState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type ImportThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootImportState,
  void,
  A
>;

export function activatePlugin(
  _: unknown,
  { globalAppRegistry }: { globalAppRegistry: AppRegistry }
) {
  // applyMiddleware should extract StoreEnhancer type automatically, but it's
  // not working here for some reason, so we assert
  const store = configureStore() as ReturnType<typeof configureStore> & {
    dispatch: ThunkDispatch<RootImportState, void, AnyAction>;
  };

  store.dispatch(globalAppRegistryActivated(globalAppRegistry));

  const onDataServiceConnected = (
    err: Error | undefined,
    dataService: DataService
  ) => {
    store.dispatch(dataServiceConnected(err, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onDataServiceDisconnected = () => {
    store.dispatch(dataServiceDisconnected());
  };

  // Abort the import operation when it's in progress.
  globalAppRegistry.on('data-service-disconnected', onDataServiceDisconnected);

  const onOpenImport = ({
    namespace,
    origin,
  }: {
    namespace: string;
    origin: 'menu' | 'crud-toolbar' | 'empty-state';
  }) => {
    store.dispatch(openImport({ namespace, origin }));
  };

  globalAppRegistry.on('open-import', onOpenImport);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener(
        'data-service-disconnected',
        onDataServiceDisconnected
      );
      globalAppRegistry.removeListener('open-import', onOpenImport);
    },
  };
}
