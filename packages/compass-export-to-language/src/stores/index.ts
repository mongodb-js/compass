import type { Action } from 'redux';
import { createStore, type Reducer } from 'redux';
import type { QueryExpression, InputExpression } from '../modules/transpiler';
import { isValidExportMode } from '../modules/transpiler';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type AppRegistry from 'hadron-app-registry';

function isAction<A extends Action>(
  action: Action,
  type: A['type']
): action is A {
  return action.type === type;
}

type ExportToLanguageState = {
  inputExpression: InputExpression;
  modalOpen: boolean;
  uri: string;
  namespace: string;
};

const INITIAL_STATE = {
  inputExpression: { filter: '', exportMode: 'Query' as const },
  modalOpen: false,
  uri: '<uri>',
  namespace: '',
};

const OPEN_MODAL = 'export-to-language/OPEN_MODAL' as const;
interface OpenModalAction {
  type: typeof OPEN_MODAL;
  inputExpression: InputExpression;
}

export function openModal(inputExpression: InputExpression): OpenModalAction {
  return { type: OPEN_MODAL, inputExpression };
}

const CLOSE_MODAL = 'export-to-language/CLOSE_MODAL' as const;
interface CloseModalAction {
  type: typeof CLOSE_MODAL;
}

export function closeModal(): CloseModalAction {
  return { type: CLOSE_MODAL };
}

const reducer: Reducer<ExportToLanguageState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<OpenModalAction>(action, OPEN_MODAL)) {
    return {
      ...state,
      modalOpen: true,
      inputExpression: action.inputExpression,
    };
  }
  if (isAction<CloseModalAction>(action, CLOSE_MODAL)) {
    return {
      ...state,
      modalOpen: false,
    };
  }
  return state;
};

function getCurrentlyConnectedUri(
  dataService: ExportToLanguageServices['dataService']
) {
  let connectionStringUrl;

  try {
    connectionStringUrl = dataService.getConnectionString().clone();
  } catch {
    return '<uri>';
  }

  if (
    // TODO: we should probably remove the default app name in place that knows
    // what is default app name, like data service or compass-connections plugin
    /^(mongodb compass|compass web)/i.exec(
      connectionStringUrl.searchParams.get('appName') || ''
    )
  ) {
    connectionStringUrl.searchParams.delete('appName');
  }

  return connectionStringUrl.href;
}

export type ExportToLanguageOptions = Pick<
  CollectionTabPluginMetadata,
  'namespace'
>;

export type ExportToLanguageServices = {
  localAppRegistry: AppRegistry;
  dataService: Pick<DataService, 'getConnectionString'>;
};

export function activatePlugin(
  { namespace }: ExportToLanguageOptions,
  { localAppRegistry, dataService }: ExportToLanguageServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(reducer, {
    ...INITIAL_STATE,
    namespace,
    uri: getCurrentlyConnectedUri(dataService),
  });

  on(
    localAppRegistry,
    'open-aggregation-export-to-language',
    (aggregation: string) => {
      store.dispatch(
        openModal({
          aggregation: aggregation,
          exportMode: 'Pipeline',
        })
      );
    }
  );

  on(
    localAppRegistry,
    'open-query-export-to-language',
    (
      queryStrings: Omit<Partial<QueryExpression>, 'exportMode'>,
      exportMode = 'Query'
    ) => {
      if (!isValidExportMode(exportMode) || exportMode === 'Pipeline') {
        throw new Error(
          exportMode
            ? `Export mode "${exportMode}" is not a valid export mode value for query export`
            : 'Export mode must be provided with the type of query you want to export to.'
        );
      }
      const query: QueryExpression = {
        exportMode,
        filter: '{}',
      };

      for (const k of [
        'filter',
        'project',
        'sort',
        'collation',
        'skip',
        'limit',
        'maxTimeMS',
      ] as const) {
        if (queryStrings[k]) {
          if (k === 'filter') {
            query[k] = queryStrings[k] ?? query[k];
          } else {
            query[k] = queryStrings[k];
          }
        }
      }

      store.dispatch(openModal(query));
    }
  );

  return { store, deactivate: cleanup };
}

export default reducer;
