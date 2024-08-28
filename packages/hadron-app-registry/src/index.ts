import { AppRegistry, globalAppRegistry } from './app-registry';
export { AppRegistry, globalAppRegistry };
export {
  AppRegistryProvider,
  useGlobalAppRegistry,
  useLocalAppRegistry,
  GlobalAppRegistryProvider,
} from './react-context';
export type {
  HadronPluginComponent,
  HadronPluginConfig,
  ActivateHelpers,
} from './register-plugin';
export {
  registerHadronPlugin,
  createActivateHelpers,
  createServiceLocator,
  createServiceProvider,
} from './register-plugin';
export type { Plugin as HadronPlugin } from './app-registry';
export default AppRegistry;
