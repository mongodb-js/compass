import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import ExportToLanguageModal from './components/modal';
import { activatePlugin } from './stores';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';

const ExportToLanguagePlugin = registerCompassPlugin(
  {
    name: 'ExportToLanguage',
    component: ExportToLanguageModal,
    activate: activatePlugin,
  },
  {
    dataService: dataServiceLocator<'getConnectionString'>,
  }
);

export default ExportToLanguagePlugin;
