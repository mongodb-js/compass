import { pickBy } from 'lodash';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage';

export type QueryAttributes = Partial<
  Pick<
    FavoriteQuery,
    | 'filter'
    | 'collation'
    | 'sort'
    | 'project'
    | 'limit'
    | 'skip'
    | 'update'
    | 'hint'
  >
>;

export const getQueryAttributes = ({
  filter,
  collation,
  sort,
  project,
  limit,
  skip,
  update,
  hint,
}: QueryAttributes): QueryAttributes => {
  return pickBy(
    { filter, collation, sort, project, limit, skip, update, hint },
    Boolean
  );
};
