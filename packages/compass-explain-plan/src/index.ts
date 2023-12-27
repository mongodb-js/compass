import ExplainPlanModal from './components/explain-plan-modal';
import { activatePlugin } from './stores';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
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

function activate() {
  // noop
}

function deactivate() {
  // noop
}

export default ExplainPlanModalPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
