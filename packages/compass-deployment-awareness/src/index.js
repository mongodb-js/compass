import DeploymentAwarenessComponent from './plugin';
import DeploymentAwarenessActions from 'actions';
import DeploymentAwarenessStore from 'stores';
import TextReadButton from 'components/text-read-button';
import TextWriteButton from 'components/text-write-button';
import WriteStateStore from 'stores/write-state-store';
import ReadStateStore from 'stores/read-state-store';

/**
 * The base plugin key.
 */
const BASE = 'DeploymentAwareness';

/**
 * Write button name.
 */
const TEXT_WRITE_BUTTON = `${BASE}.TextWriteButton`;

/**
 * Read button name.
 */
const TEXT_READ_BUTTON = `${BASE}.TextReadButton`;

/**
 * The actions name.
 */
const ACTIONS = `${BASE}.Actions`;

/**
 * The store name.
 */
const STORE = `${BASE}.Store`;

/**
 * The write state store name.
 */
const WRITE_STATE_STORE = `${BASE}.WriteStateStore`;

/**
 * The read state store name.
 */
const READ_STATE_STORE = `${BASE}.ReadStateStore`;

/**
 * A sample role for the component.
 */
const ROLE = {
  name: BASE,
  component: DeploymentAwarenessComponent,
  order: 2
};

/**
 * Header item constant.
 */
const DETAILS_ITEM = 'InstanceDetails.Item';

/**
 * Activate all the components in the Deployment Awareness package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function activate(appRegistry) {
  appRegistry.registerRole(DETAILS_ITEM, ROLE);
  appRegistry.registerComponent(TEXT_READ_BUTTON, TextReadButton);
  appRegistry.registerComponent(TEXT_WRITE_BUTTON, TextWriteButton);
  appRegistry.registerAction(ACTIONS, DeploymentAwarenessActions);
  appRegistry.registerStore(STORE, DeploymentAwarenessStore);
  appRegistry.registerStore(WRITE_STATE_STORE, WriteStateStore);
  appRegistry.registerStore(READ_STATE_STORE, ReadStateStore);
}

/**
 * Deactivate all the components in the Deployment Awareness package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole(DETAILS_ITEM, ROLE);
  appRegistry.deregisterComponent(TEXT_READ_BUTTON);
  appRegistry.deregisterComponent(TEXT_WRITE_BUTTON);
  appRegistry.deregisterAction(ACTIONS);
  appRegistry.deregisterStore(STORE);
  appRegistry.deregisterStore(WRITE_STATE_STORE);
  appRegistry.deregisterStore(READ_STATE_STORE);
}

export default DeploymentAwarenessComponent;
export {
  TextReadButton,
  TextWriteButton,
  WriteStateStore,
  ReadStateStore,
  activate,
  deactivate
};
