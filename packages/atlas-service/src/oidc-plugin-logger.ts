import { EventEmitter } from 'events';
import type { MongoDBOIDCPluginOptions } from '@mongodb-js/oidc-plugin';
import type { AtlasUserConfig } from './user-config-store';

type MongoDBOIDCPluginLogger = Required<MongoDBOIDCPluginOptions>['logger'];

/**
 * oidc-plugin logger event flow for plugin creation and token request / refresh:
 *
 *        createPlugin
 *             ↓
 * serialized state provided? → no → no event
 *             ↓
 *            yes → failed to deserialize? → no → `plugin:state-updated`
 *                             ↓
 *                            yes → `plugin:deserialization-failed`
 *
 *
 *              requestToken
 *                   ↓
 *             token expired?
 *                   │
 *              no ←─┴─→ yes ───┐
 *              │               ↓  `tryRefresh` flow can also trigger separately on timeout
 *              │  ┌────────────────────────────────────────┐
 *              │  │        tryRefresh                      │
 *              │  │            ↓                           │
 *              │  │ `plugin:refresh-started`               │
 *              │  │            ↓                           │
 *              │  │  got token from issuer? → no ─┐        │
 *              │  │            ↓                  │        │
 *              │  │           yes                 │        │
 *              │  │            ↓                  │        │
 *              │  │`plugin:refresh-succeeded`     │        │
 *              │  │            ↓                  │        │
 *              │  │    start state update         │        │
 *              │  │            ↓                  │        │
 *              │  │    state update failed → yes ─┤        │
 *              │  │            ↓                  ↓        │
 *              │  │            no  `plugin:refresh-failed` │─┐            ┌────────────────────────────────────────────┐
 *              │  │            ↓                           │ │            │ `plugin:auth-attempt-started`              │
 *              │  │  `plugin:state-updated`                │ │            │        ↓                                   │
 *              │  └────────────────────────────────────────┘ │            │ is attempt successfull? → no               │
 *              ↓               │                             ↓            │        ↓                  ↓                │
 * `plugin:skip-auth-attempt` ←─┘            for flow in getAllowedFlows → │       yes     `plugin:auth-attempt-failed` │
 *              ↓                                                          │        ↓                                   │
 *    `plugin:auth-succeeded` ← yes ← do we have new token set in state? ← │ `plugin:state-updated`                     │
 *                                                 ↓                       │        ↓                                   │
 *                                                 no                      │ `plugin:auth-attempt-succeeded`            │
 *                                                 ↓                       └────────────────────────────────────────────┘
 *                                         `plugin:auth-failed`
 */
type OidcPluginLogger = MongoDBOIDCPluginLogger & {
  on(evt: 'atlas-service-token-refreshed', fn: () => void): void;
  on(evt: 'atlas-service-token-refresh-failed', fn: () => void): void;
  on(evt: 'atlas-service-signed-out', fn: () => void): void;
  on(
    evt: 'atlas-service-user-config-changed',
    fn: (newConfig: AtlasUserConfig) => void
  ): void;
  once(evt: 'atlas-service-token-refreshed', fn: () => void): void;
  once(evt: 'atlas-service-token-refresh-failed', fn: () => void): void;
  once(evt: 'atlas-service-signed-out', fn: () => void): void;
  once(
    evt: 'atlas-service-user-config-changed',
    fn: (newConfig: AtlasUserConfig) => void
  ): void;
  emit(evt: 'atlas-service-token-refreshed'): void;
  emit(evt: 'atlas-service-token-refresh-failed'): void;
  emit(evt: 'atlas-service-signed-out'): void;
  emit(
    evt: 'atlas-service-user-config-changed',
    newConfig: AtlasUserConfig
  ): void;
} & Pick<EventEmitter, 'removeAllListeners'>;

export const OidcPluginLogger: { new (): OidcPluginLogger } = EventEmitter;
