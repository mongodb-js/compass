import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';
import ExportToLanguageModal from './components/modal';
import { activatePlugin } from './stores';

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
