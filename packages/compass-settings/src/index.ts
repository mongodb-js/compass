import { registerHadronPlugin } from 'hadron-app-registry';
import SettingsPlugin from './components/index';
import { onActivated } from './stores';

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export const CompassSettingsPlugin = registerHadronPlugin({
  name: 'CompassSettings',
  component: SettingsPlugin,
  activate: onActivated,
});

export { activate, deactivate };
export { default as metadata } from '../package.json';
