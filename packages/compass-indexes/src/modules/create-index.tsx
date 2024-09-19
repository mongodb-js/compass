import { EJSON, ObjectId } from 'bson';
import type { CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { isCollationValid } from 'mongodb-query-parser';
import React from 'react';
import type { Action, Reducer, Dispatch } from 'redux';
import { Badge } from '@mongodb-js/compass-components';
import { isAction } from '../utils/is-action';
import type { InProgressIndex } from './regular-indexes';
import type { IndexesThunkAction } from '.';
import { hasColumnstoreIndex } from '../utils/columnstore-indexes';
import type { RootState } from '.';
import { fetchIndexes } from './regular-indexes';

export enum ActionTypes {
  FieldAdded = 'compass-indexes/create-index/fields/field-added',
  FieldTypeUpdated = 'compass-indexes/create-index/fields/field-type-updated',
  FieldRemoved = 'compass-indexes/create-index/fields/field-removed',
  FieldsChanged = 'compass-indexes/create-index/fields/fields-changed',

  OptionChanged = 'compass-indexes/create-index/option-changed',
  OptionToggled = 'compass-indexes/create-index/option-toggled',

  ErrorEncountered = 'compass-indexes/create-index/error-encountered',
  ErrorCleared = 'compass-indexes/create-index/error-cleared',

  CreateIndexOpened = 'compass-indexes/create-index/create-index-shown',
  CreateIndexClosed = 'compass-indexes/create-index/create-index-hidden',

  // These also get used by the regular-indexes slice's reducer
  IndexCreationStarted = 'compass-indexes/create-index/index-creation-started',
  IndexCreationSucceeded = 'compass-indexes/create-index/index-creation-succeeded',
  IndexCreationFailed = 'compass-indexes/create-index/index-creation-failed',
}

// fields

export type Field = { name: string; type: string };

const INITIAL_FIELDS_STATE = [{ name: '', type: '' }];

type FieldAddedAction = {
  type: ActionTypes.FieldAdded;
};

type FieldTypeUpdatedAction = {
  type: ActionTypes.FieldTypeUpdated;
  idx: number;
  fType: string;
};

type FieldRemovedAction = {
  type: ActionTypes.FieldRemoved;
  idx: number;
};

type FieldsChangedAction = {
  type: ActionTypes.FieldsChanged;
  fields: Field[];
};

type ErrorEncounteredAction = {
  type: ActionTypes.ErrorEncountered;
  error: string;
};

type ErrorClearedAction = {
  type: ActionTypes.ErrorCleared;
};

type CreateIndexOpenedAction = {
  type: ActionTypes.CreateIndexOpened;
};

type CreateIndexClosedAction = {
  type: ActionTypes.CreateIndexClosed;
};

export type IndexCreationStartedAction = {
  type: ActionTypes.IndexCreationStarted;
  inProgressIndex: InProgressIndex;
};

export type IndexCreationSucceededAction = {
  type: ActionTypes.IndexCreationSucceeded;
  inProgressIndexId: string;
};

export type IndexCreationFailedAction = {
  type: ActionTypes.IndexCreationFailed;
  inProgressIndexId: string;
  error: string;
};

export const fieldAdded = () => ({
  type: ActionTypes.FieldAdded,
});

export const fieldRemoved = (idx: number) => ({
  type: ActionTypes.FieldRemoved,
  idx,
});

export const fieldTypeUpdated = (idx: number, fType: string) => ({
  type: ActionTypes.FieldTypeUpdated,
  idx: idx,
  fType,
});

const fieldsChanged = (fields: Field[]) => ({
  type: ActionTypes.FieldsChanged,
  fields: fields,
});

export const updateFieldName = (idx: number, name: string) => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const fields: Field[] = [...state.createIndex.fields];
    if (idx >= 0 && idx < state.createIndex.fields.length) {
      // Check if field name exists.
      if (
        state.createIndex.fields.some(
          (field: Field, eIdx: number) => field.name === name && eIdx !== idx
        )
      ) {
        dispatch(errorEncountered('Index keys must be unique'));
        return;
      }
      const field = { ...fields[idx] };
      field.name = name;
      fields[idx] = field;
      dispatch(fieldsChanged(fields));
    }
  };
};

// options

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

type OptionNames = keyof typeof OPTIONS;

export type CheckboxOptions = {
  [k in OptionNames]: typeof OPTIONS[k]['type'] extends 'checkbox' ? k : never;
}[OptionNames];

export type InputOptions = Exclude<OptionNames, CheckboxOptions>;

type Options = {
  [k in OptionNames]: {
    enabled: boolean;
  } & (typeof OPTIONS[k]['type'] extends 'checkbox'
    ? { value: boolean }
    : { value: string });
};

type ValueForOption<O extends OptionNames> =
  typeof OPTIONS[O]['type'] extends 'checkbox' ? boolean : string;

type OptionChangedAction<O extends OptionNames = OptionNames> = {
  type: ActionTypes.OptionChanged;
  name: O;
  value: ValueForOption<O>;
};

export function optionChanged<O extends OptionNames>(
  optionName: O,
  newValue: ValueForOption<O>
): OptionChangedAction<O> {
  return { type: ActionTypes.OptionChanged, name: optionName, value: newValue };
}

type OptionToggledAction<O extends OptionNames = OptionNames> = {
  type: ActionTypes.OptionToggled;
  name: O;
  enabled: boolean;
};

export function optionToggled<O extends OptionNames>(
  optionName: O,
  enabled: boolean
): OptionToggledAction<O> {
  return { type: ActionTypes.OptionToggled, name: optionName, enabled };
}

const INITIAL_OPTIONS_STATE = Object.fromEntries(
  (Object.keys(OPTIONS) as OptionNames[]).map((name) => {
    return [
      name,
      { value: OPTIONS[name].type === 'checkbox' ? false : '', enabled: false },
    ];
  })
) as Options;

// other

export type State = {
  // modal state
  inProgress: boolean;
  isVisible: boolean;

  // validation
  error: string | null;

  // form fields related
  fields: Field[];

  // index options
  options: Options;
};

export const INITIAL_STATE: State = {
  inProgress: false,
  isVisible: false,
  error: null,
  fields: INITIAL_FIELDS_STATE,
  options: INITIAL_OPTIONS_STATE,
};

function getInitialState() {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

//-------

export const createIndexOpened = () => ({
  type: ActionTypes.CreateIndexOpened,
});

export const createIndexClosed = () => ({
  type: ActionTypes.CreateIndexClosed,
});

const errorEncountered = (error: string): ErrorEncounteredAction => ({
  type: ActionTypes.ErrorEncountered,
  error,
});

export const errorCleared = (): ErrorClearedAction => ({
  type: ActionTypes.ErrorCleared,
});

const indexCreationStarted = (
  inProgressIndex: InProgressIndex
): IndexCreationStartedAction => ({
  type: ActionTypes.IndexCreationStarted,
  inProgressIndex,
});

const indexCreationSucceeded = (
  inProgressIndexId: string
): IndexCreationSucceededAction => ({
  type: ActionTypes.IndexCreationSucceeded,
  inProgressIndexId,
});

const indexCreationFailed = (
  inProgressIndexId: string,
  error: string
): IndexCreationFailedAction => ({
  type: ActionTypes.IndexCreationFailed,
  inProgressIndexId,
  error,
});

export type CreateIndexSpec = {
  [key: string]: string | number;
};
const prepareIndex = ({
  ns,
  name,
  spec,
}: {
  ns: string;
  name?: string;
  spec: CreateIndexSpec;
}): InProgressIndex => {
  const inProgressIndexId = new ObjectId().toHexString();
  const inProgressIndexFields = Object.keys(spec).map((field: string) => ({
    field,
    value: spec[field],
  }));
  const inProgressIndexName =
    name ||
    Object.keys(spec).reduce((previousValue, currentValue) => {
      return `${
        previousValue === '' ? '' : `${previousValue}_`
      }${currentValue}_${spec[currentValue]}`;
    }, '');
  return {
    id: inProgressIndexId,
    extra: {
      status: 'inprogress',
    },
    key: spec,
    fields: inProgressIndexFields,
    name: inProgressIndexName,
    ns,
    size: 0,
    relativeSize: 0,
    usageCount: 0,
  };
};

function isEmptyValue(value: unknown) {
  if (value === '') {
    return true;
  }
  if (value === false) {
    return true;
  }

  return false;
}

export const createIndex = (): IndexesThunkAction<
  Promise<void>,
  | ErrorEncounteredAction
  | IndexCreationStartedAction
  | IndexCreationSucceededAction
  | IndexCreationFailedAction
> => {
  return async (
    dispatch,
    getState,
    { dataService, track, connectionInfoRef }
  ) => {
    const state = getState();
    const spec = {} as CreateIndexSpec;

    // Check for field errors.
    if (
      state.createIndex.fields.some(
        (field: Field) => field.name === '' || field.type === ''
      )
    ) {
      dispatch(errorEncountered('You must select a field name and type'));
      return;
    }

    const stateOptions = state.createIndex.options;

    state.createIndex.fields.forEach((field: Field) => {
      let type: string | number = field.type;
      if (field.type === '1 (asc)') type = 1;
      if (field.type === '-1 (desc)') type = -1;
      spec[field.name] = type;
    });

    const options: CreateIndexesOptions = {};

    // Check for collation errors.
    const collation =
      isCollationValid(stateOptions.collation.value ?? '') || undefined;

    if (stateOptions.collation.enabled && !collation) {
      dispatch(errorEncountered('You must provide a valid collation object'));
      return;
    }

    if (stateOptions.collation.enabled) {
      options.collation = collation;
    }

    if (stateOptions.unique.enabled) {
      options.unique = stateOptions.unique.value;
    }

    if (stateOptions.sparse.enabled) {
      options.sparse = stateOptions.sparse.value;
    }

    // The server will generate a name when we don't provide one.
    if (stateOptions.name.enabled && stateOptions.name.value) {
      options.name = stateOptions.name.value;
    }

    if (stateOptions.expireAfterSeconds.enabled) {
      options.expireAfterSeconds = Number(
        stateOptions.expireAfterSeconds.value
      );
      if (isNaN(options.expireAfterSeconds)) {
        dispatch(
          errorEncountered(
            `Bad TTL: "${String(stateOptions.expireAfterSeconds.value)}"`
          )
        );
        return;
      }
    }

    if (stateOptions.wildcardProjection.enabled) {
      try {
        options.wildcardProjection = EJSON.parse(
          stateOptions.wildcardProjection.value ?? ''
        ) as Document;
      } catch (err) {
        dispatch(errorEncountered(`Bad WildcardProjection: ${String(err)}`));
        return;
      }
    }

    if (stateOptions.columnstoreProjection.enabled) {
      try {
        // @ts-expect-error columnstoreProjection is not a part of CreateIndexesOptions yet.
        options.columnstoreProjection = EJSON.parse(
          stateOptions.columnstoreProjection.value ?? ''
        ) as Document;
      } catch (err) {
        dispatch(errorEncountered(`Bad ColumnstoreProjection: ${String(err)}`));
        return;
      }
    }

    if (stateOptions.partialFilterExpression.enabled) {
      try {
        options.partialFilterExpression = EJSON.parse(
          state.createIndex.options.partialFilterExpression.value ?? ''
        ) as Document;
      } catch (err) {
        dispatch(
          errorEncountered(`Bad PartialFilterExpression: ${String(err)}`)
        );
        return;
      }
    }

    // Based on current form field value clean up default values from options.
    // This makes a index creation request cleaner and allows to avoid issues in
    // cases where options like `sparse` or `unique` set by the user to `false`
    // explicitly can lead to the server errors for some index types that don't
    // support them (even though technically user is not enabling them)
    for (const optionName of Object.keys(
      stateOptions
    ) as (keyof typeof stateOptions)[]) {
      if (isEmptyValue(stateOptions[optionName].value)) {
        // @ts-expect-error columnstoreProjection is not a part of CreateIndexesOptions yet.
        delete options[optionName];
      }
    }

    const ns = state.namespace;
    const inProgressIndex = prepareIndex({ ns, name: options.name, spec });

    dispatch(indexCreationStarted(inProgressIndex));

    const trackEvent = {
      unique: options.unique,
      ttl: stateOptions.expireAfterSeconds.enabled,
      columnstore_index: hasColumnstoreIndex(state.createIndex.fields),
      has_columnstore_projection: stateOptions.columnstoreProjection.enabled,
      has_wildcard_projection: stateOptions.wildcardProjection.enabled,
      custom_collation: stateOptions.collation.enabled,
      geo:
        state.createIndex.fields.filter(
          ({ type }: { type: string }) => type === '2dsphere'
        ).length > 0,
      atlas_search: false,
    };

    try {
      await dataService.createIndex(ns, spec as IndexSpecification, options);
      dispatch(indexCreationSucceeded(inProgressIndex.id));
      track('Index Created', trackEvent, connectionInfoRef.current);

      // Start a new fetch so that the newly added index's details can be
      // loaded. indexCreationSucceeded() will remove the in-progress one, but
      // we still need the new info.
      await dispatch(fetchIndexes());
    } catch (err) {
      dispatch(indexCreationFailed(inProgressIndex.id, (err as Error).message));
    }
  };
};

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (isAction<FieldAddedAction>(action, ActionTypes.FieldAdded)) {
    return {
      ...state,
      fields: [...state.fields, { name: '', type: '' }],
    };
  }

  if (isAction<FieldRemovedAction>(action, ActionTypes.FieldRemoved)) {
    const fields = [...state.fields];
    fields.splice(action.idx, 1);
    return {
      ...state,
      fields,
    };
  }

  if (isAction<FieldTypeUpdatedAction>(action, ActionTypes.FieldTypeUpdated)) {
    const fields = [...state.fields];
    if (action.idx >= 0 && action.idx < fields.length) {
      const field = { ...fields[action.idx] };
      field.type = action.fType;
      fields[action.idx] = field;
    }
    return {
      ...state,
      fields,
    };
  }

  if (isAction<FieldsChangedAction>(action, ActionTypes.FieldsChanged)) {
    return {
      ...state,
      fields: action.fields,
    };
  }

  if (isAction<OptionChangedAction>(action, ActionTypes.OptionChanged)) {
    return {
      ...state,
      options: {
        ...state.options,
        [action.name]: {
          value: action.value,
          // "enable" checkbox-type inputs on first change (they are not hidden
          // behind a checkbox), otherwise keep the current value
          enabled:
            OPTIONS[action.name].type === 'checkbox'
              ? true
              : state.options[action.name].enabled,
        },
      },
    };
  }

  if (isAction<OptionToggledAction>(action, ActionTypes.OptionToggled)) {
    return {
      ...state,
      options: {
        ...state.options,
        [action.name]: {
          ...state.options[action.name],
          enabled: action.enabled,
        },
      },
    };
  }

  if (
    isAction<CreateIndexOpenedAction>(action, ActionTypes.CreateIndexOpened)
  ) {
    return {
      ...state,
      isVisible: true,
    };
  }

  if (isAction<ErrorEncounteredAction>(action, ActionTypes.ErrorEncountered)) {
    return {
      ...state,
      error: action.error,
    };
  }

  if (isAction<ErrorClearedAction>(action, ActionTypes.ErrorCleared)) {
    return {
      ...state,
      error: null,
    };
  }

  if (
    isAction<CreateIndexClosedAction>(action, ActionTypes.CreateIndexClosed)
  ) {
    return {
      ...state,
      isVisible: false,
    };
  }

  if (
    isAction<IndexCreationStartedAction>(
      action,
      ActionTypes.IndexCreationStarted
    )
  ) {
    return {
      ...state,
      error: null,
      inProgress: true,
    };
  }
  if (
    isAction<IndexCreationSucceededAction>(
      action,
      ActionTypes.IndexCreationSucceeded
    )
  ) {
    return {
      ...getInitialState(),
    };
  }

  if (
    isAction<IndexCreationFailedAction>(action, ActionTypes.IndexCreationFailed)
  ) {
    return { ...state, inProgress: false, error: action.error };
  }

  return state;
};

export default reducer;
