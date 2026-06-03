export type { ConnectionSecrets } from './connection-secrets';
export { extractSecrets, mergeSecrets } from './connection-secrets';
export type {
  ConnectionInfo,
  ConnectionFavoriteOptions,
  AtlasClusterMetadata,
  McpAccess,
  McpPreset,
} from './connection-info';
export { normalizeMcpAccess } from './connection-info';
export { getConnectionTitle } from './connection-title';
