import { EJSON } from 'bson';
import { AtlasUserData, FileUserData } from '@mongodb-js/compass-user-data';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { RecentQuerySchema, FavoriteQuerySchema } from './query-storage-schema';
import { PipelineSchema } from './pipeline-storage-schema';
import {
  BaseCompassRecentQueryStorage,
  BaseCompassFavoriteQueryStorage,
} from './base-query-storage';
import { BaseCompassPipelineStorage } from './base-pipeline-storage';

const serialize = (content: unknown, space?: number) =>
  EJSON.stringify(content, undefined, space, { relaxed: false });
const deserialize = (content: string) =>
  EJSON.parse(content, { relaxed: false });

// Web-specific factory functions
export type WebStorageOptions = {
  orgId: string;
  projectId: string;
  atlasService: AtlasService;
};

export function createWebRecentQueryStorage(options: WebStorageOptions) {
  const userData = new AtlasUserData(RecentQuerySchema, 'RecentQueries', {
    orgId: options.orgId,
    projectId: options.projectId,
    atlasService: options.atlasService,
    serialize: (content) => serialize(content),
    deserialize,
  });
  return new BaseCompassRecentQueryStorage(userData);
}

export function createWebFavoriteQueryStorage(options: WebStorageOptions) {
  const userData = new AtlasUserData(FavoriteQuerySchema, 'FavoriteQueries', {
    orgId: options.orgId,
    projectId: options.projectId,
    atlasService: options.atlasService,
    serialize: (content) => serialize(content),
    deserialize,
  });
  return new BaseCompassFavoriteQueryStorage(userData);
}

export function createWebPipelineStorage(options: WebStorageOptions) {
  const userData = new AtlasUserData(PipelineSchema, 'SavedPipelines', {
    orgId: options.orgId,
    projectId: options.projectId,
    atlasService: options.atlasService,
    serialize: (content) => serialize(content),
    deserialize,
  });
  return new BaseCompassPipelineStorage<typeof PipelineSchema>(userData);
}

// Electron-specific factory functions
export type ElectronStorageOptions = {
  basepath?: string;
};

export function createElectronRecentQueryStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new FileUserData(RecentQuerySchema, 'RecentQueries', {
    basePath: options.basepath,
    serialize: (content) => serialize(content, 2),
    deserialize,
  });
  return new BaseCompassRecentQueryStorage(userData);
}

export function createElectronFavoriteQueryStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new FileUserData(FavoriteQuerySchema, 'FavoriteQueries', {
    basePath: options.basepath,
    serialize: (content) => serialize(content, 2),
    deserialize,
  });
  return new BaseCompassFavoriteQueryStorage(userData);
}

export function createElectronPipelineStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new FileUserData(PipelineSchema, 'SavedPipelines', {
    basePath: options.basepath,
  });
  return new BaseCompassPipelineStorage<typeof PipelineSchema>(userData);
}
