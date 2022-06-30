import { ENTERPRISE, COMMUNITY } from '../constants/server-version';

export const CHANGE_VERSION = 'sidebar/server-version/CHANGE_VERSION';

export const INITIAL_STATE = {
  versionDistro: '',
  versionNumber: '',
  isDataLake: false,
  dataLakeVersion: ''
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_VERSION) {
    return action.version;
  }
  return state;
}

export function changeInstanceStatus(instance, newStatus) {
  if (newStatus !== 'ready') {
    return;
  }

  return {
    type: CHANGE_VERSION,
    version: {
      versionDistro: instance.build.isEnterprise ? ENTERPRISE : COMMUNITY,
      versionNumber: instance.build.version,
      isDataLake: instance.dataLake.isDataLake,
      dataLakeVersion: instance.dataLake.version || null
    }
  };
}
