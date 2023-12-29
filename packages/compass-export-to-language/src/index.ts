import { registerHadronPlugin } from 'hadron-app-registry';
import ExportToLanguageModal from './components/modal';
import { activatePlugin } from './stores';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';

const ExportToLanguagePlugin = registerHadronPlugin(
  {
    name: 'ExportToLanguage',
    component: ExportToLanguageModal,
    activate: activatePlugin,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<'getConnectionString'>,
  }
);

function activate() {
  // noop
}

function deactivate() {
  // noop
}

export default ExportToLanguagePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
