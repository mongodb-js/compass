import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { registerHadronPlugin } from 'hadron-app-registry';
import { DatabasePlugin, onActivated } from './plugin';

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export const CompassDatabasePlugin = registerHadronPlugin<
  object,
  { logger: () => LoggerAndTelemetry }
>({
  name: 'CompassDatabase',
  component: DatabasePlugin as React.FunctionComponent,
  activate: onActivated,
});

export { DatabaseTabsProvider } from './components/database-tabs-provider';
export { activate, deactivate };
export { default as metadata } from '../package.json';
