import type AppRegistry from 'hadron-app-registry';
import {
  createStore as _createStore,
  applyMiddleware,
  combineReducers,
} from 'redux';
import thunk from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import type { BaseQuery } from '../constants/query-properties';
import { mapFormFieldsToQuery, mapQueryToFormFields } from '../utils/query';
import type { ChangeFilterEvent } from '../modules/change-filter';
import {
  queryBarReducer,
  INITIAL_STATE as INITIAL_QUERY_BAR_STATE,
  changeSchemaFields,
  applyFilterChange,
  QueryBarActions,
  updatePreferencesMaxTimeMS,
} from './query-bar-reducer';
import { aiQueryReducer, disableAIFeature } from './ai-query-reducer';
import { getQueryAttributes } from '../utils';
import {
  FavoriteQueryStorage,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
import type { PreferencesAccess } from 'compass-preferences-model';
import { defaultPreferencesInstance } from 'compass-preferences-model';

// Partial of DataService that mms shares with Compass.
type QueryBarDataService = Pick<DataService, 'sample' | 'getConnectionString'>;

export type QueryBarStoreOptions = {
  serverVersion: string;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  query: BaseQuery;
  namespace: string;
  dataProvider: {
    dataProvider?: QueryBarDataService;
  };
  atlasService: AtlasService;
  preferences: PreferencesAccess;

  // For testing.
  basepath?: string;
  favoriteQueryStorage?: FavoriteQueryStorage;
  recentQueryStorage?: RecentQueryStorage;
};

export const rootQueryBarReducer = combineReducers({
  queryBar: queryBarReducer,
  aiQuery: aiQueryReducer,
});

export type RootState = ReturnType<typeof rootQueryBarReducer>;

export type QueryBarExtraArgs = {
  globalAppRegistry?: AppRegistry;
  localAppRegistry?: AppRegistry;
  favoriteQueryStorage: FavoriteQueryStorage;
  recentQueryStorage: RecentQueryStorage;
  dataService: Pick<QueryBarDataService, 'sample'>;
  atlasService: AtlasService;
  preferences: PreferencesAccess;
};

export type QueryBarThunkDispatch<A extends AnyAction = AnyAction> =
  ThunkDispatch<RootState, QueryBarExtraArgs, A>;

export type QueryBarThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, RootState, QueryBarExtraArgs, A>;

export function configureStore(options: Partial<QueryBarStoreOptions> = {}) {
  const {
    serverVersion,
    localAppRegistry,
    globalAppRegistry,
    query,
    namespace,
    dataProvider,
    preferences = defaultPreferencesInstance, // TODO(COMPASS-7405): Proper service injection
    atlasService = new AtlasService(),
    recentQueryStorage = new RecentQueryStorage({ namespace }),
    favoriteQueryStorage = new FavoriteQueryStorage({ namespace }),
  } = options;

  const store = _createStore(
    rootQueryBarReducer,
    {
      queryBar: {
        ...INITIAL_QUERY_BAR_STATE,
        namespace: namespace ?? '',
        host: dataProvider?.dataProvider?.getConnectionString().hosts.join(','),
        serverVersion: serverVersion ?? '3.6.0',
        fields: mapQueryToFormFields({
          ...DEFAULT_FIELD_VALUES,
          ...getQueryAttributes(query ?? {}),
        }),
        preferencesMaxTimeMS: preferences.getPreferences().maxTimeMS ?? null,
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        dataService: dataProvider?.dataProvider ?? {
          sample: () => {
            /* no-op for environments where dataService is not provided at all. */
            return Promise.resolve([]);
          },
        },
        localAppRegistry,
        globalAppRegistry,
        recentQueryStorage,
        favoriteQueryStorage,
        atlasService,
        preferences,
      })
    )
  );
  // TODO(COMPASS-7405): unsubscribe on deactivate
  preferences.onPreferenceValueChanged('maxTimeMS', (newValue) =>
    store.dispatch(updatePreferencesMaxTimeMS(newValue))
  );

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;

    const instanceStore: any = globalAppRegistry.getStore('App.InstanceStore');
    const instance = instanceStore.getState().instance;

    store.dispatch({
      type: QueryBarActions.ChangeReadonlyConnectionStatus,
      readonly: !instance.isWritable,
    });

    // these can change later
    instance.on('change:isWritable', () => {
      store.dispatch({
        type: QueryBarActions.ChangeReadonlyConnectionStatus,
        readonly: !instance.isWritable,
      });
    });
  }

  atlasService.on('user-config-changed', (config) => {
    if (config.enabledAIFeature === false) {
      store.dispatch(disableAIFeature());
    }
  });

  localAppRegistry?.on('fields-changed', (fields) => {
    store.dispatch(changeSchemaFields(fields.autocompleteFields));
  });

  localAppRegistry?.on('query-bar-change-filter', (evt: ChangeFilterEvent) => {
    store.dispatch(applyFilterChange(evt));
  });

  (store as any).getCurrentQuery = () => {
    return mapFormFieldsToQuery(store.getState().queryBar.fields);
  };

  return store as typeof store & {
    getCurrentQuery(): unknown;
  };
}

export default configureStore;
