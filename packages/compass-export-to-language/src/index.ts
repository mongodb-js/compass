import { registerHadronPlugin } from 'hadron-app-registry';
import ExportToLanguageModal from './components/modal';
import { activatePlugin } from './stores';
import type { DataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';

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

export default ExportToLanguagePlugin;
