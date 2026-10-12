import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions, ReadPreferenceMode } from 'mongodb';
import { cloneDeep } from 'lodash';

export interface UpdateReadPreferenceAction {
  type: 'update-read-preference';
  mode?: ReadPreferenceMode;
  // Each entry is one tag set in the `key0:value0,key1:value1` connection
  // string format. An empty string is an empty tag set, which lets the driver
  // fall back to any eligible member when none of the previous sets match.
  tagSets: string[];
  maxStalenessSeconds?: string;
}

export function supportsReadPreferenceOptions(
  mode: string | null | undefined
): boolean {
  return !!mode && mode !== 'primary';
}

export function handleUpdateReadPreference({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdateReadPreferenceAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  const updatedConnectionString = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  if (action.mode) {
    updatedSearchParams.set('readPreference', action.mode);
  } else {
    updatedSearchParams.delete('readPreference');
  }

  updatedSearchParams.delete('readPreferenceTags');
  updatedSearchParams.delete('maxStalenessSeconds');

  if (supportsReadPreferenceOptions(action.mode)) {
    const hasTagSets = action.tagSets.some((tagSet) => tagSet !== '');
    if (hasTagSets) {
      for (const tagSet of action.tagSets) {
        updatedSearchParams.append('readPreferenceTags', tagSet);
      }
    }
    if (action.maxStalenessSeconds) {
      updatedSearchParams.set(
        'maxStalenessSeconds',
        action.maxStalenessSeconds
      );
    }
  }

  return {
    connectionOptions: {
      ...cloneDeep(connectionOptions),
      connectionString: updatedConnectionString.toString(),
    },
  };
}
