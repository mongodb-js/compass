import connect from './connect';
import { ConnectionInfo, ConnectionFavoriteOptions } from './connection-info';
import { ConnectionOptions } from './connection-options';
import {
  ConnectionStorage,
  promisifyAmpersandMethod,
} from './connection-storage';
import { getConnectionTitle } from './connection-title';
import DataService from './data-service';
import {
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
} from './legacy/legacy-connection-model';
import {
  ConnectionSecrets,
  extractSecrets,
  mergeSecrets,
} from './connection-secrets';

export {
  ConnectionInfo,
  ConnectionFavoriteOptions,
  ConnectionOptions,
  ConnectionStorage,
  DataService,
  connect,
  getConnectionTitle,
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
  ConnectionSecrets,
  extractSecrets,
  mergeSecrets,
  promisifyAmpersandMethod,
};
