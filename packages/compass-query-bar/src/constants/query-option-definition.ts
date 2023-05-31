import type { TextInput } from '@mongodb-js/compass-components';
import type { ComponentProps } from 'react';
import React from 'react';
import { usePreference } from 'compass-preferences-model';
import type { QueryProperty } from './query-properties';

export type QueryOption = QueryProperty;

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
    link: 'https://mongodb.com/docs/compass/current/query/filter/?utm_source=compass&utm_medium=product',
  },
  project: {
    name: 'project',
    type: 'document',
    placeholder: '{ field: 0 }',
    link: 'https://mongodb.com/docs/manual/tutorial/project-fields-from-query-results/?utm_source=compass&utm_medium=product',
  },
  sort: {
    name: 'sort',
    type: 'document',
    placeholder: "{ field: -1 } or [['field', -1]]",
    link: 'https://mongodb.com/docs/manual/reference/method/cursor.sort/?utm_source=compass&utm_medium=product',
  },
  collation: {
    name: 'collation',
    type: 'document',
    placeholder: "{ locale: 'simple' }",
    link: 'https://mongodb.com/docs/master/reference/collation/?utm_source=compass&utm_medium=product',
  },
  skip: {
    name: 'skip',
    type: 'numeric',
    placeholder: '0',
    link: 'https://mongodb.com/docs/manual/reference/method/cursor.skip/?utm_source=compass&utm_medium=product',
  },
  limit: {
    name: 'limit',
    type: 'numeric',
    placeholder: '0',
    link: 'https://mongodb.com/docs/manual/reference/method/cursor.limit/?utm_source=compass&utm_medium=product',
  },
  maxTimeMS: {
    name: 'maxTimeMS',
    label: 'Max Time MS',
    type: 'numeric',
    placeholder: '60000',
    link: 'https://mongodb.com/docs/manual/reference/method/cursor.maxTimeMS/?utm_source=compass&utm_medium=product',
    extraTextInputProps() {
      const preferenceMaxTimeMS = usePreference('maxTimeMS', React);
      const props: { max?: number; placeholder?: string } = {
        max: preferenceMaxTimeMS,
      };
      if (preferenceMaxTimeMS !== undefined && preferenceMaxTimeMS < 60000) {
        props.placeholder = String(preferenceMaxTimeMS);
      }
      return props;
    },
  },
};

export type QueryBarRowLayout = QueryOption | QueryOption[];
export type QueryBarLayout = QueryBarRowLayout[];
