import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from 'hadron-app-registry';
import {
  reducer,
  INITIAL_STATE,
  openExplainPlanModal,
  abortAnyOngoingOp,
} from './explain-plan-modal-store';
import type { AggregateOptions, Document, FindOptions } from 'mongodb';
import type AppRegistry from 'hadron-app-registry';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
// import type { ChatbotService } from '@mongodb-js/docs-chatbot/provider';

import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

export type OpenExplainPlanModalEvent =
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
  globalAppRegistry: AppRegistry;
  // chatbot: ChatbotService;
};

export function activatePlugin(
  { namespace, isDataLake }: ExplainPlanModalConfigureStoreOptions,
  services: ExplainPlanModalServices,
  { on, cleanup, addCleanup }: ActivateHelpers
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

  addCleanup(() => store.dispatch(abortAnyOngoingOp()));

  return { store, deactivate: cleanup };
}
