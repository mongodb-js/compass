import type { TextInput } from '@mongodb-js/compass-components';
import type { ComponentProps } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import type { QueryProperty } from './query-properties';

export type QueryOption = Exclude<QueryProperty, 'update'>;
export type QueryOptionOfTypeDocument = Exclude<
  QueryProperty,
  'maxTimeMS' | 'limit' | 'skip'
>;

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
      const maxTimeMSEnvLimit = usePreference('maxTimeMSEnvLimit');

      // Determine the effective max limit when environment limit is set (> 0)
      const effectiveMaxLimit = maxTimeMSEnvLimit
        ? preferenceMaxTimeMS
          ? Math.min(preferenceMaxTimeMS, maxTimeMSEnvLimit)
          : maxTimeMSEnvLimit
        : preferenceMaxTimeMS;

      const props: {
        max?: number;
        placeholder?: string;
      } = {
        max: effectiveMaxLimit,
      };

      if (effectiveMaxLimit && effectiveMaxLimit < 60000) {
        props.placeholder = `${+effectiveMaxLimit}`;
      }

      return props;
    },
  },
};

export type QueryBarRowLayout = QueryOption | QueryOption[];
export type QueryBarLayout = QueryBarRowLayout[];
