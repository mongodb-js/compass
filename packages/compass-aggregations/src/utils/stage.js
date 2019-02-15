import {EMPTY_STAGE} from '../constants';
import { ObjectId } from 'bson';

export const generateStageWithDefaults = (props = {}) => {
  return {
    ...EMPTY_STAGE,
    id: new ObjectId().toHexString(),
    ...props
  };
};
