import { createContext, useContext } from 'react';
import type { PipelineStorage } from './pipeline-storage';
import type { FavoriteQueryStorage, RecentQueryStorage } from './query-storage';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';

// Re-export the MCP prompt-name validator from the renderer-facing
// subpath so renderer components (e.g. the edit-item modal) can use the
// same helpers the storage schema uses. Keeps regex + error text in one
// place across main and renderer.
export {
  MCP_PROMPT_NAME_PATTERN,
  MCP_PROMPT_NAME_MIN_LENGTH,
  MCP_PROMPT_NAME_MAX_LENGTH,
  MCP_PROMPT_NAME_HINT,
  isValidMcpPromptName,
  validateMcpPromptName,
  suggestMcpPromptName,
} from './mcp-prompt-name';

// Re-export the persisted-record types so renderer code can refer to
// saved items by name. Renderer files import from `/provider` (the
// `no-restricted-imports` lint rule blocks the main package entry for
// browser-only code), so the types need to exit through this surface.
export type { RecentQuery, FavoriteQuery } from './query-storage-schema';
export type { SavedPipeline } from './pipeline-storage-schema';

// Define the options types locally since we deleted the original files
export type QueryStorageOptions = {
  basepath?: string;
  orgId?: string;
  projectId?: string;
  getResourceUrl?: (path?: string) => string;
  authenticatedFetch?: (
    url: RequestInfo | URL,
    options?: RequestInit
  ) => Promise<Response>;
};

export type PipelineStorageOptions = {
  basePath?: string;
  orgId?: string;
  projectId?: string;
  getResourceUrl?: (path?: string) => string;
  authenticatedFetch?: (
    url: RequestInfo | URL,
    options?: RequestInit
  ) => Promise<Response>;
};

export type { PipelineStorage, FavoriteQueryStorage, RecentQueryStorage };

export type FavoriteQueryStorageAccess = {
  getStorage(options?: QueryStorageOptions): FavoriteQueryStorage;
};

export type RecentQueryStorageAccess = {
  getStorage(options?: QueryStorageOptions): RecentQueryStorage;
};

export type PipelineStorageAccess = {
  getStorage(options?: PipelineStorageOptions): PipelineStorage;
};

const PipelineStorageContext = createContext<PipelineStorageAccess | undefined>(
  undefined
);
const FavoriteQueryStorageContext = createContext<
  FavoriteQueryStorageAccess | undefined
>(undefined);
const RecentQueryStorageContext = createContext<
  RecentQueryStorageAccess | undefined
>(undefined);

export const PipelineStorageProvider = PipelineStorageContext.Provider;
export const FavoriteQueryStorageProvider =
  FavoriteQueryStorageContext.Provider;
export const RecentQueryStorageProvider = RecentQueryStorageContext.Provider;

export const usePipelineStorage = () => useContext(PipelineStorageContext);
export const pipelineStorageLocator = createServiceLocator(
  usePipelineStorage,
  'pipelineStorageLocator'
);

export const useFavoriteQueryStorageAccess = () =>
  useContext(FavoriteQueryStorageContext);
export const favoriteQueryStorageAccessLocator = createServiceLocator(
  useFavoriteQueryStorageAccess,
  'favoriteQueryStorageAccessLocator'
);

export const useRecentQueryStorageAccess = () =>
  useContext(RecentQueryStorageContext);
export const recentQueryStorageAccessLocator = createServiceLocator(
  useRecentQueryStorageAccess,
  'recentQueryStorageAccessLocator'
);
