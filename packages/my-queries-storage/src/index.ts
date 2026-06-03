// Main exports - these use runtime detection for backward compatibility
export {
  createWebRecentQueryStorage,
  createWebFavoriteQueryStorage,
  createWebPipelineStorage,
  createElectronRecentQueryStorage,
  createElectronFavoriteQueryStorage,
  createElectronPipelineStorage,
} from './storage-factories';

export type {
  WebStorageOptions,
  ElectronStorageOptions,
} from './storage-factories';

// Re-export shared interfaces
export type {
  RecentQueryStorageInterface,
  FavoriteQueryStorageInterface,
  PipelineStorageInterface,
} from './storage-interfaces';

// Re-export schemas
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';

// MCP prompt-name validation (used by storage schemas, UI, and the MCP server).
export {
  MCP_PROMPT_NAME_PATTERN,
  MCP_PROMPT_NAME_MIN_LENGTH,
  MCP_PROMPT_NAME_MAX_LENGTH,
  MCP_PROMPT_NAME_HINT,
  isValidMcpPromptName,
  validateMcpPromptName,
  suggestMcpPromptName,
} from './mcp-prompt-name';

// Re-export provider types
export type {
  FavoriteQueryStorageAccess,
  RecentQueryStorageAccess,
  PipelineStorageAccess,
} from './provider';

// Re-export provider components
export {
  PipelineStorageProvider,
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
} from './provider';
