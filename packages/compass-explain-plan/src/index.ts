import ExplainPlanModal from './components/explain-plan-modal';
import { activatePlugin } from './stores';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { compassAssistantServiceLocator } from '@mongodb-js/compass-assistant';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

const ExplainPlanModalPlugin = registerCompassPlugin(
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
    compassAssistant: compassAssistantServiceLocator,
  }
);

export default ExplainPlanModalPlugin;
