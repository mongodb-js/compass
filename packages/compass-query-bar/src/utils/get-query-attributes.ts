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
  const attributes: QueryAttributes = {
    filter,
    collation,
    sort,
    project,
    limit,
    skip,
    update,
    hint,
  };
  for (const key of Object.keys(attributes) as (keyof QueryAttributes)[]) {
    if (!attributes[key]) {
      delete attributes[key];
    }
  }
  return attributes;
};
