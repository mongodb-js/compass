import type { TextInput } from '@mongodb-js/compass-components';
import type { ComponentProps } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import type { QueryProperty } from './query-properties';

export type QueryOption = Exclude<QueryProperty, 'update'>;
export type QueryOptionOfTypeDocument = Exclude<
  QueryProperty,
  'maxTimeMS' | 'limit' | 'skip'
>;

/**
 * Data Explorer limits (5 minutes = 300,000ms)
 * This limit is artificial but necessary for the backend that powers DE.
 * https://github.com/10gen/mms/blob/dea184f4a40db0a64ed0d6665d36265f62ae4f65/server/src/main/com/xgen/cloud/services/clusterconnection/runtime/ws/ClusterConnectionServerProvider.java#L50-L51
 */
export const WEB_MAX_TIME_MS_LIMIT = 300_000;

export const OPTION_DEFINITION: {
  [optionName in QueryOption]: {
    name: optionName;
    type: 'document' | 'numeric';
    placeholder: string;
    link: string;
    label?: string;
    extraTextInputProps?: () => Partial<ComponentProps<typeof TextInput>>;
  };
} = {
  filter: {
    name: 'filter',
    type: 'document',
    placeholder: "Type a query: { field: 'value' }",
    link: 'https://docs.mongodb.com/compass/current/query/filter/',
  },
  project: {
    name: 'project',
    type: 'document',
    placeholder: '{ field: 0 }',
    link: 'https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/',
  },
  sort: {
    name: 'sort',
    type: 'document',
    placeholder: "{ field: -1 } or [['field', -1]]",
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.sort/',
  },
  hint: {
    name: 'hint',
    label: 'Index Hint',
    type: 'document',
    placeholder: '{ field: -1 }',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.hint/',
  },
  collation: {
    name: 'collation',
    type: 'document',
    placeholder: "{ locale: 'simple' }",
    link: 'https://docs.mongodb.com/master/reference/collation/',
  },
  skip: {
    name: 'skip',
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.skip/',
  },
  limit: {
    name: 'limit',
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.limit/',
  },
  maxTimeMS: {
    name: 'maxTimeMS',
    label: 'Max Time MS',
    type: 'numeric',
    placeholder: '60000',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.maxTimeMS/',
    extraTextInputProps() {
      const preferenceMaxTimeMS = usePreference('maxTimeMS');
      const showMaxTimeMSWarning =
        usePreference('showMaxTimeMSWarning') ?? false;

      // Determine the effective max limit when warning is enabled
      const effectiveMaxLimit = showMaxTimeMSWarning
        ? preferenceMaxTimeMS
          ? Math.min(preferenceMaxTimeMS, WEB_MAX_TIME_MS_LIMIT)
          : WEB_MAX_TIME_MS_LIMIT
        : preferenceMaxTimeMS;

      const props: {
        max?: number;
        placeholder?: string;
      } = {
        max: effectiveMaxLimit,
      };

      if (effectiveMaxLimit !== undefined && effectiveMaxLimit < 60000) {
        props.placeholder = String(effectiveMaxLimit);
      }

      return props;
    },
  },
};

export type QueryBarRowLayout = QueryOption | QueryOption[];
export type QueryBarLayout = QueryBarRowLayout[];
