import { EJSON } from 'bson';
import { AtlasUserData, FileUserData } from '@mongodb-js/compass-user-data';
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
  getResourceUrl: (path?: string) => string;
  authenticatedFetch: (
    url: RequestInfo | URL,
    options?: RequestInit
  ) => Promise<Response>;
};

export function createWebRecentQueryStorage(options: WebStorageOptions) {
  const userData = new AtlasUserData(RecentQuerySchema, 'RecentQueries', {
    orgId: options.orgId,
    projectId: options.projectId,
    getResourceUrl: options.getResourceUrl,
    authenticatedFetch: options.authenticatedFetch,
    serialize: (content) => EJSON.stringify(content),
    deserialize: (content: string) => EJSON.parse(content),
  });
  return new BaseCompassRecentQueryStorage(userData);
}

export function createWebFavoriteQueryStorage(options: WebStorageOptions) {
  const userData = new AtlasUserData(FavoriteQuerySchema, 'FavoriteQueries', {
    orgId: options.orgId,
    projectId: options.projectId,
    getResourceUrl: options.getResourceUrl,
    authenticatedFetch: options.authenticatedFetch,
    serialize: (content) => EJSON.stringify(content),
    deserialize: (content: string) => EJSON.parse(content),
  });
  return new BaseCompassFavoriteQueryStorage(userData);
}

export function createWebPipelineStorage(options: WebStorageOptions) {
  const userData = new AtlasUserData(PipelineSchema, 'SavedPipelines', {
    orgId: options.orgId,
    projectId: options.projectId,
    getResourceUrl: options.getResourceUrl,
    authenticatedFetch: options.authenticatedFetch,
    serialize: (content) => EJSON.stringify(content),
    deserialize: (content: string) => EJSON.parse(content),
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
    serialize: (content) => EJSON.stringify(content, undefined, 2),
    deserialize: (content: string) => EJSON.parse(content),
  });
  return new BaseCompassRecentQueryStorage(userData);
}

export function createElectronFavoriteQueryStorage(
  options: ElectronStorageOptions = {}
) {
  const userData = new FileUserData(FavoriteQuerySchema, 'FavoriteQueries', {
    basePath: options.basepath,
    serialize: (content) => EJSON.stringify(content, undefined, 2),
    deserialize: (content: string) => EJSON.parse(content),
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
