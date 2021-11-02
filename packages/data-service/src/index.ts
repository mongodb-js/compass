import connect from './connect';
import { ConnectionInfo } from './connection-info';
import { getConnectionTitle } from './connection-title';
import DataService from './data-service';
import {
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
} from './legacy/legacy-connection-model';

export {
  ConnectionInfo,
  DataService,
  connect,
  getConnectionTitle,
  convertConnectionModelToInfo,
  convertConnectionInfoToModel,
};
