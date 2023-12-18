import { isEmpty, isObject } from 'lodash';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage';

export const getQueryAttributes = ({
  filter,
  collation,
  sort,
  project,
  limit,
  skip,
  update,
}: Partial<FavoriteQuery>): Partial<FavoriteQuery> => {
  const attributes = {
    filter,
    collation,
    sort,
    project,
    limit,
    skip,
    update,
  };
  Object.keys(attributes).forEach((k) => {
    const key = k as keyof typeof attributes;
    if (
      !attributes[key] ||
      (isObject(attributes[key]) && isEmpty(attributes[key]))
    ) {
      delete attributes[key];
    }
  });
  return attributes;
};
