import { AppRegistry, globalAppRegistry } from './app-registry';
export { AppRegistry, globalAppRegistry };
export {
  AppRegistryProvider,
  useGlobalAppRegistry,
  useLocalAppRegistry,
} from './react-context';
export type {
  HadronPluginComponent,
  HadronPluginConfig,
  ActivateHelpers,
} from './register-plugin';
export { registerHadronPlugin, createActivateHelpers } from './register-plugin';
export default AppRegistry;
