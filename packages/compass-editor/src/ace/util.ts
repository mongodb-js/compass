import { BSON_TYPES, QUERY_OPERATORS } from '@mongodb-js/mongodb-constants';
import semver from 'semver';
import type { MongoDBCompletion } from '../types';

const filter = (
  version: string,
  entries: MongoDBCompletion[],
  prefix: string
) => {
  const parsedVersion = semver.parse(version);
  return entries.filter((e) => {
    if (!e.name) return false;
    const cleanVersion = parsedVersion
      ? [parsedVersion.major, parsedVersion.minor, parsedVersion.patch].join(
          '.'
        )
      : version;
    return e.name.startsWith(prefix) && semver.gte(cleanVersion, e.version);
  });
};

/**
 * The match completions.
 */
const MATCH_COMPLETIONS = ([] as MongoDBCompletion[]).concat(
  QUERY_OPERATORS,
  BSON_TYPES
);

export { filter, MATCH_COMPLETIONS };
