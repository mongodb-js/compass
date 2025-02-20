import ExplainPlanModal from './components/explain-plan-modal';
import { activatePlugin } from './stores';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

const ExplainPlanModalPlugin = registerHadronPlugin(
  {
    name: 'ExplainPlanModal',
    component: ExplainPlanModal,
    activate: activatePlugin,
  },
  {
    logger: createLoggerLocator('EXPLAIN-PLAN-MODAL-UI'),
    track: telemetryLocator,
    connectionInfoRef: connectionInfoRefLocator,
    dataService: dataServiceLocator as DataServiceLocator<
      'explainAggregate' | 'explainFind' | 'isCancelError'
    >,
    preferences: preferencesLocator,
  }
);

export default ExplainPlanModalPlugin;
