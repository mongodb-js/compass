import { isEmpty, isObject } from 'lodash';
import type { BaseQuery } from './../constants/query-properties';

export const getQueryAttributes = ({
  filter,
  collation,
  sort,
  project,
  limit,
  skip,
}: Omit<BaseQuery, 'maxTimeMS'>): Omit<BaseQuery, 'maxTimeMS'> => {
  const attributes = {
    filter,
    collation,
    sort,
    project,
    limit,
    skip,
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
