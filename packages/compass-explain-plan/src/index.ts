import ExplainPlanModal from './components/explain-plan-modal';
import { activatePlugin } from './stores';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

const ExplainPlanModalPlugin = registerHadronPlugin(
  {
    name: 'ExplainPlanModal',
    component: ExplainPlanModal,
    activate: activatePlugin,
  },
  {
    logger: createLoggerAndTelemetryLocator('EXPLAIN-PLAN-MODAL-UI'),
    dataService: dataServiceLocator as DataServiceLocator<
      'explainAggregate' | 'explainFind' | 'isCancelError'
    >,
    preferences: preferencesLocator,
  }
);

export default ExplainPlanModalPlugin;
