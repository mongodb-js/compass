import { AppRegistry, globalAppRegistry } from './app-registry';
import type { Role } from './app-registry';
export { AppRegistry, globalAppRegistry };
export type { Role };
export {
  AppRegistryProvider,
  useAppRegistryContext,
  useAppRegistryComponent,
  useAppRegistryRole,
} from './react-context';
export default AppRegistry;
