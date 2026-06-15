import { ON_PREM, type ENVS } from '@mongodb-js/mongodb-constants';

export type ServerEnvironment = (typeof ENVS)[number];

const INITIAL_STATE: ServerEnvironment = ON_PREM;

export default function reducer(state = INITIAL_STATE) {
  return state;
}
