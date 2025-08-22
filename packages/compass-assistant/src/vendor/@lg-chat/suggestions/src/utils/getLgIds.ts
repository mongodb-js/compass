import { LgIdString } from '@mongodb-js/compass-components';

export const DEFAULT_LGID_ROOT = 'lg-suggestion_card';

export const getLgIds = (root: LgIdString = DEFAULT_LGID_ROOT) => {
  const ids = {
    root,
  } as const;
  return ids;
};

export type GetLgIdsReturnType = ReturnType<typeof getLgIds>;
