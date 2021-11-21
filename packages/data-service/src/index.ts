import connect from './connect';
import { ConnectionInfo } from './connection-info';
import { ConnectionOptions } from './connection-options';
import { ConnectionStorage } from './connection-storage';
import { getConnectionTitle } from './connection-title';
import DataService from './data-service';
import {
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
} from './legacy/legacy-connection-model';

export {
  ConnectionInfo,
  ConnectionOptions,
  ConnectionStorage,
  DataService,
  connect,
  getConnectionTitle,
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
};
