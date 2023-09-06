import { Badge } from '@mongodb-js/compass-components';
import React from 'react';
import type { Reducer } from 'redux';
import { RESET_FORM } from '../reset-form';
import { isAction } from '../../utils/is-action';

export const UNSUPPORTED_COLUMNSTORE_INDEX_OPTIONS: OptionNames[] = [
  'sparse',
  'unique',
];

export const OPTIONS = {
  unique: {
    type: 'checkbox',
    label: 'Create unique index',
    description:
      'A unique index ensures that the indexed fields do not store duplicate values; i.e. enforces uniqueness for the indexed fields.',
  },
  name: {
    type: 'text',
    label: 'Index name',
    description:
      'Enter the name of the index to create, or leave blank to have MongoDB create a default name for the index.',
    units: undefined,
    optional: true,
  },
  expireAfterSeconds: {
    type: 'number',
    label: 'Create TTL',
    description:
      'TTL indexes are special single-field indexes that MongoDB can use to automatically remove documents from a collection after a certain amount of time or at a specific clock time.',
    units: 'seconds',
    optional: false,
  },
  partialFilterExpression: {
    type: 'code',
    label: 'Partial Filter Expression',
    description:
      'Partial indexes only index the documents in a collection that meet a specified filter expression.',
    units: undefined,
    optional: false,
  },
  wildcardProjection: {
    type: 'code',
    label: 'Wildcard Projection',
    description:
      'Wildcard indexes support queries against unknown or arbitrary fields.',
    units: undefined,
    optional: false,
  },
  collation: {
    type: 'code',
    label: 'Use Custom Collation',
    description:
      'Collation allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks.',
    units: undefined,
    optional: false,
  },
  columnstoreProjection: {
    type: 'code',
    label: (
      <>
        Columnstore Projection&nbsp;<Badge>Preview</Badge>
      </>
    ),
    description:
      'Columnstore indexes support queries against unknown or arbitrary fields.',
    units: undefined,
    optional: false,
  },
  sparse: {
    type: 'checkbox',
    label: 'Create sparse index',
    description:
      'Sparse indexes only contain entries for documents that have the indexed field, even if the index field contains a null value. The index skips over any document that is missing the indexed field.',
  },
} as const;

export type OptionNames = keyof typeof OPTIONS;

export type CheckboxOptions = {
  [k in OptionNames]: typeof OPTIONS[k]['type'] extends 'checkbox' ? k : never;
}[OptionNames];

export type InputOptions = Exclude<OptionNames, CheckboxOptions>;

type State = {
  [k in OptionNames]: {
    enabled: boolean;
  } & (typeof OPTIONS[k]['type'] extends 'checkbox'
    ? { value: boolean }
    : { value: string });
};

type ValueForOption<O extends OptionNames> =
  typeof OPTIONS[O]['type'] extends 'checkbox' ? boolean : string;

enum Actions {
  ChangeOption = 'compass-indexes/create-index/change-option',
  ChangeOptionEnabled = 'compass-indexes/create-index/change-option-enabled',
}

type ChangeOptionAction<O extends OptionNames = OptionNames> = {
  type: Actions.ChangeOption;
  name: O;
  value: ValueForOption<O>;
};

export function changeOption<O extends OptionNames>(
  optionName: O,
  newValue: ValueForOption<O>
): ChangeOptionAction<O> {
  return { type: Actions.ChangeOption, name: optionName, value: newValue };
}

type ChangeOptionEnabledAction<O extends OptionNames = OptionNames> = {
  type: Actions.ChangeOptionEnabled;
  name: O;
  enabled: boolean;
};

export function changeOptionEnabled<O extends OptionNames>(
  optionName: O,
  enabled: boolean
): ChangeOptionEnabledAction<O> {
  return { type: Actions.ChangeOptionEnabled, name: optionName, enabled };
}

export const INITIAL_STATE = Object.fromEntries(
  (Object.keys(OPTIONS) as OptionNames[]).map((name) => {
    return [
      name,
      { value: OPTIONS[name].type === 'checkbox' ? false : '', enabled: false },
    ];
  })
) as State;

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  if (isAction<ChangeOptionAction>(action, Actions.ChangeOption)) {
    return {
      ...state,
      [action.name]: {
        value: action.value,
        // "enable" checkbox-type inputs on first change (they are not hidden
        // behind a checkbox), otherwise keep the current value
        enabled:
          OPTIONS[action.name].type === 'checkbox'
            ? true
            : state[action.name].enabled,
      },
    };
  }
  if (
    isAction<ChangeOptionEnabledAction>(action, Actions.ChangeOptionEnabled)
  ) {
    return {
      ...state,
      [action.name]: {
        ...state[action.name],
        enabled: action.enabled,
      },
    };
  }
  if (action.type === RESET_FORM) {
    // Deep clone on reset
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
  return state;
};

export default reducer;
