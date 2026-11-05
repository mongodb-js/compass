import { EJSON } from 'bson';
import {
  UserData,
  createBridgeUserDataFetch,
  type AuthenticatedFetch,
} from '@mongodb-js/compass-user-data';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { RecentQuerySchema, FavoriteQuerySchema } from './query-storage-schema';
import { PipelineSchema } from './pipeline-storage-schema';
import {
  BaseCompassRecentQueryStorage,
  BaseCompassFavoriteQueryStorage,
} from './base-query-storage';
import { BaseCompassPipelineStorage } from './base-pipeline-storage';

// Web-specific factory functions
export type WebStorageOptions = {
  orgId: string;
  projectId: string;
  atlasService: AtlasService;
};

export function createWebRecentQueryStorage(options: WebStorageOptions) {
  const userData = new UserData(
    RecentQuerySchema,
    'RecentQueries',
    {
      kind: 'atlas',
      orgId: options.orgId,
      projectId: options.projectId,
      atlasService: options.atlasService,
    },
    {
      serialize: (content) => EJSON.stringify(content),
      deserialize: (content: string) => EJSON.parse(content),
    }
  );
  return new BaseCompassRecentQueryStorage(userData);
}

export function createWebFavoriteQueryStorage(options: WebStorageOptions) {
  const userData = new UserData(
    FavoriteQuerySchema,
    'FavoriteQueries',
    {
      kind: 'atlas',
      orgId: options.orgId,
      projectId: options.projectId,
      atlasService: options.atlasService,
    },
    {
      serialize: (content) => EJSON.stringify(content),
      deserialize: (content: string) => EJSON.parse(content),
    }
  );
  return new BaseCompassFavoriteQueryStorage(userData);
}

export function createWebPipelineStorage(options: WebStorageOptions) {
  const userData = new UserData(
    PipelineSchema,
    'SavedPipelines',
    {
      kind: 'atlas',
      orgId: options.orgId,
      projectId: options.projectId,
      atlasService: options.atlasService,
    },
    {
      serialize: (content) => EJSON.stringify(content),
      deserialize: (content: string) => EJSON.parse(content),
    }
  );
  return new BaseCompassPipelineStorage<typeof PipelineSchema>(userData);
}

// Electron-specific factory functions
export type ElectronStorageOptions = {
  /** Defaults to the preload script's bridge to main */
  fetch?: AuthenticatedFetch;
};

const localEnvironment = ({ fetch }: ElectronStorageOptions) => ({
  kind: 'local' as const,
  fetch: fetch ?? createBridgeUserDataFetch(),
});

export function createElectronRecentQueryStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new UserData(
    RecentQuerySchema,
    'RecentQueries',
    localEnvironment(options),
    {
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content: string) => EJSON.parse(content),
    }
  );
  return new BaseCompassRecentQueryStorage(userData);
}

export function createElectronFavoriteQueryStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new UserData(
    FavoriteQuerySchema,
    'FavoriteQueries',
    localEnvironment(options),
    {
      serialize: (content) => EJSON.stringify(content, undefined, 2),
      deserialize: (content: string) => EJSON.parse(content),
    }
  );
  return new BaseCompassFavoriteQueryStorage(userData);
}

export function createElectronPipelineStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new UserData(
    PipelineSchema,
    'SavedPipelines',
    localEnvironment(options)
  );
  return new BaseCompassPipelineStorage<typeof PipelineSchema>(userData);
}
