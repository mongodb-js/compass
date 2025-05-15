import { setupHadronDistribution } from '../setup-hadron-distribution';
import dns from 'dns';
import ensureError from 'ensure-error';
import { ipcRenderer } from 'hadron-ipc';
import EventEmitter from 'events';

setupHadronDistribution();

// DNS Configuration
// Ensures IPv4 is preferred over IPv6 to avoid potential connection issues
// See: https://github.com/nodejs/node/issues/40537
dns.setDefaultResultOrder('ipv4first');

// Configure NODE_OPTIONS to ensure sub-processes (like the shell) also prefer IPv4
process.env.NODE_OPTIONS ??= '';
if (!process.env.NODE_OPTIONS.includes('--dns-result-order')) {
  process.env.NODE_OPTIONS += ` --dns-result-order=ipv4first`;
}

// Global Error Handling
// Sets up error reporting to main process before any other initialization
// Ensures all unhandled errors are properly logged and reported
window.addEventListener('error', (event: ErrorEvent) => {
  event.preventDefault();
  const error = ensureError(event.error);
  void ipcRenderer?.call('compass:error:fatal', {
    message: error.message,
    stack: error.stack,
  });
});

window.addEventListener(
  'unhandledrejection',
  (event: PromiseRejectionEvent) => {
    event.preventDefault();
    const error = ensureError(event.reason);
    void ipcRenderer?.call('compass:rejection:fatal', {
      message: error.message,
      stack: error.stack,
    });
  }
);

// Event Emitter Configuration
// Increases the default maximum number of listeners to prevent
// potential memory leaks in development mode
EventEmitter.defaultMaxListeners = 100;

// ----------------------------------------------------------------------------
// NOTE: keep this import last to avoid any potential issues with stateful setup
// interfering with the bootstrap, and make sure the rest of the bootstrap has
// taken effect.

import { app } from './application';
void app.init();
