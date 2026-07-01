import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import {
  reducer,
  INITIAL_STATE,
  openExplainPlanModal,
  openExplainPlanForInterpret,
} from './explain-plan-modal-store';
import type { AggregateOptions, Document, FindOptions } from 'mongodb';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { CompassAssistantService } from '@mongodb-js/compass-assistant';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

type ExplainPlanInput =
  | {
      query: { filter: Document } & Pick<
        FindOptions,
        'projection' | 'collation' | 'sort' | 'skip' | 'limit' | 'maxTimeMS'
      >;
      aggregation?: never;
    }
  | {
      query?: never;
      aggregation: {
        pipeline: Document[];
        collation?: AggregateOptions['collation'];
        maxTimeMS?: number;
      };
    };

export type OpenExplainPlanModalEvent = ExplainPlanInput & {
  initialViewType?: 'tree' | 'json';
};

export type OpenExplainPlanForInterpretEvent = ExplainPlanInput;

export type ExplainPlanModalConfigureStoreOptions = Pick<
  CollectionTabPluginMetadata,
  'namespace' | 'isDataLake'
>;

export type ExplainPlanModalServices = {
  dataService: Pick<
    DataService,
    'explainFind' | 'explainAggregate' | 'isCancelError'
  >;
  logger: Logger;
  track: TrackFunction;
  connectionInfoRef: ConnectionInfoRef;
  preferences: PreferencesAccess;
  localAppRegistry: AppRegistry;
  compassAssistant: CompassAssistantService;
};

export function activatePlugin(
  { namespace, isDataLake }: ExplainPlanModalConfigureStoreOptions,
  services: ExplainPlanModalServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    { ...INITIAL_STATE, namespace, isDataLake },
    applyMiddleware(thunk.withExtraArgument(services))
  );

  on(services.localAppRegistry, 'open-explain-plan-modal', (event) => {
    void store.dispatch(
      openExplainPlanModal(event as OpenExplainPlanModalEvent)
    );
  });

  on(services.localAppRegistry, 'open-explain-plan-for-interpret', (event) => {
    void store.dispatch(
      openExplainPlanForInterpret(event as OpenExplainPlanForInterpretEvent)
    );
  });

  return { store, deactivate: cleanup };
}
