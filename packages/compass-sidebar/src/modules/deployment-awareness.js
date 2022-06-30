import { ATLAS, ADL, ON_PREM } from '../constants/deployment-awareness';
import serversArray from '../utils/servers-array';

export const CHANGE_ATLAS_INSTANCE = 'sidebar/deployment-awareness/CHANGE_ATLAS_INSTANCE';
export const CHANGE_TOPOLOGY = 'sidebar/deployment-awareness/CHANGE_TOPOLOGY';

export const INITIAL_STATE = {
  topologyType: 'Unknown',
  setName: '',
  servers: [],
  isDataLake: false,
  env: ON_PREM
};


export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_ATLAS_INSTANCE) {
    return {
      ...state,
      ...action.instance
    };
  }

  if (action.type === CHANGE_TOPOLOGY) {
    return {
      ...state,
      ...action.topology
    };
  }

  return state;
}

export function changeAtlasInstanceStatus({ isAtlas, dataLake}, newStatus) {
  if (newStatus !== 'ready') {
    return;
  }

  if (!isAtlas) {
    return;
  }

  const env = dataLake.isDataLake ? ADL : ATLAS;

  return {
    type: CHANGE_ATLAS_INSTANCE,
    instance: {
      isDataLake: dataLake.isDataLake,
      env
    }
  };
}

export function changeTopologyDescription(topologyDescription) {
  const servers = serversArray(topologyDescription.servers);

  return {
    type: CHANGE_TOPOLOGY,
    topology: {
      topologyType: topologyDescription.type,
      setName: topologyDescription.setName,
      servers
    }
  };
}
