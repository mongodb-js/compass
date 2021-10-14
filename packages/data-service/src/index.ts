import connect from './connect';
import { getConnectionTitle } from './connection-title';
import DataService from './data-service';
import {
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
} from './legacy/legacy-connection-model';
import { ConnectionInfo } from './connection-info';

export {
  ConnectionInfo,
  DataService,
  connect,
  getConnectionTitle,
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
};
