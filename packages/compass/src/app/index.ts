/**
 * IMPORTANT:
 *
 * This file (index.ts) is not meant for regular application lifecycle logic.
 * It should ONLY contain code that:
 * 1. Must run before any other application code
 * 2. Sets up critical infrastructure that other modules depend on
 * 3. Handles global error boundaries and process-level configuration
 *
 * Examples of what belongs here:
 * - Stateful setup for core node modules (dns, EventEmitter)
 * - Process-level environment variables
 * - Any setup required by other modules (including 3rd party modules) before
 *   they can be imported
 *
 * All other application lifecycle code, initialization, and business logic
 * should be placed in application.tsx instead.
 *
 * Rule of thumb: If the code isn't required for other modules to function
 * correctly during import, it probably belongs in application.tsx.
 */
import { setupHadronDistribution } from '../setup-hadron-distribution';
import dns from 'dns';
import EventEmitter from 'events';

// Setup paths and environment variables for electron globals
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
