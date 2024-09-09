import { EJSON, ObjectId } from 'bson';
import type { CreateIndexesOptions, IndexSpecification } from 'mongodb';
import { isCollationValid } from 'mongodb-query-parser';
import React from 'react';
import type { Action, Reducer, Dispatch } from 'redux';
import { Badge } from '@mongodb-js/compass-components';
import { resetForm, RESET_FORM } from './reset-form';
import { isAction } from '../utils/is-action';
import type { InProgressIndex } from './regular-indexes';
import type { IndexesThunkAction } from '.';
import { hasColumnstoreIndex } from '../utils/columnstore-indexes';

export enum ActionTypes {
  AddField = 'compass-indexes/create-index/fields/add-field',
  UpdateFieldType = 'compass-indexes/create-index/fields/update-field-type',
  RemoveField = 'compass-indexes/create-index/fields/remove-field',
  ChangeFields = 'compass-indexes/create-index/fields/change-fields',

  ChangeOption = 'compass-indexes/create-index/change-option',
  ChangeOptionEnabled = 'compass-indexes/create-index/change-option-enabled',

  HandleError = 'compass-indexes/create-index/handle-error',
  ClearError = 'compass-indexes/create-index/clear-error',

  ToggleInProgress = 'compass-indexes/create-index/toggle-in-progress',
  ToggleIsVisible = 'compass-indexes/create-index/toggle-is-visible',
}

// fields

export type Field = { name: string; type: string };

export const INITIAL_FIELDS_STATE = [{ name: '', type: '' }];

type AddFieldAction = {
  type: ActionTypes.AddField;
};

type UpdateFieldTypeAction = {
  type: ActionTypes.UpdateFieldType;
  idx: number;
  fType: string;
};

type RemoveFieldAction = {
  type: ActionTypes.RemoveField;
  idx: number;
};

type ChangeFieldsAction = {
  type: ActionTypes.ChangeFields;
  fields: Field[];
};

export const UNSUPPORTED_COLUMNSTORE_INDEX_OPTIONS: OptionNames[] = [
  'sparse',
  'unique',
];

export const addField = () => ({
  type: ActionTypes.AddField,
});

export const removeField = (idx: number) => ({
  type: ActionTypes.RemoveField,
  idx,
});

export const updateFieldType = (idx: number, fType: string) => ({
  type: ActionTypes.UpdateFieldType,
  idx: idx,
  fType,
});

export const changeFields = (fields: Field[]) => ({
  type: ActionTypes.ChangeFields,
  fields: fields,
});

export const updateFieldName = (idx: number, name: string) => {
  return (dispatch: Dispatch, getState: () => State) => {
    const state = getState();
    const fields: Field[] = [...state.fields];
    if (idx >= 0 && idx < state.fields.length) {
      // Check if field name exists.
      if (
        state.fields.some(
          (field: Field, eIdx: number) => field.name === name && eIdx !== idx
        )
      ) {
        dispatch(handleError('Index keys must be unique'));
        return;
      }
      const field = { ...fields[idx] };
      field.name = name;
      fields[idx] = field;
      dispatch(changeFields(fields));
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

export type OptionNames = keyof typeof OPTIONS;

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

type ChangeOptionAction<O extends OptionNames = OptionNames> = {
  type: ActionTypes.ChangeOption;
  name: O;
  value: ValueForOption<O>;
};

export function changeOption<O extends OptionNames>(
  optionName: O,
  newValue: ValueForOption<O>
): ChangeOptionAction<O> {
  return { type: ActionTypes.ChangeOption, name: optionName, value: newValue };
}

type ChangeOptionEnabledAction<O extends OptionNames = OptionNames> = {
  type: ActionTypes.ChangeOptionEnabled;
  name: O;
  enabled: boolean;
};

export function changeOptionEnabled<O extends OptionNames>(
  optionName: O,
  enabled: boolean
): ChangeOptionEnabledAction<O> {
  return { type: ActionTypes.ChangeOptionEnabled, name: optionName, enabled };
}

export const INITIAL_OPTIONS_STATE = Object.fromEntries(
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

//-------

type HandleErrorAction = {
  type: ActionTypes.HandleError;
  error: string;
};

type ClearErrorAction = {
  type: ActionTypes.ClearError;
};

type ToggleInProgressAction = {
  type: ActionTypes.ToggleInProgress;
  inProgress: boolean;
};

type ToggleIsVisibleAction = {
  type: ActionTypes.ToggleIsVisible;
  isVisible: boolean;
};

// TODO: do we need this anywhere?
/*
type CreateIndexActions =
  | AddFieldAction
  | UpdateFieldTypeAction
  | RemoveFieldAction
  | ChangeFieldsAction
  | ChangeOptionAction
  | ChangeOptionEnabledAction
  | HandleErrorAction
  | ClearErrorAction
  | ToggleInProgressAction
  | ToggleIsVisibleAction
  */

// TODO: drop toggleInProgress, use an action that uses it
export const toggleInProgress = (
  inProgress: boolean
): ToggleInProgressAction => ({
  type: ActionTypes.ToggleInProgress,
  inProgress,
});

// TODO: drop toggleIsVisible, use an action that uses it
export const toggleIsVisible = (isVisible: boolean) => ({
  type: ActionTypes.ToggleIsVisible,
  isVisible,
});

export const handleError = (error: string): HandleErrorAction => ({
  type: ActionTypes.HandleError,
  error,
});

export const clearError = (): ClearErrorAction => ({
  type: ActionTypes.ClearError,
});

export type CreateIndexSpec = {
  [key: string]: string | number;
};

export const openCreateIndexModal = () => {
  return (dispatch: Dispatch) => {
    dispatch(toggleIsVisible(true));
  };
};

export const closeCreateIndexModal = () => {
  return (dispatch: Dispatch) => {
    dispatch(toggleIsVisible(false));
    dispatch(resetForm());
  };
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

function isEmptyValue(value: any) {
  if (value === '') {
    return true;
  }
  if (value === false) {
    return true;
  }

  return false;
}

// TODO: arguably this should move to the root store
export const createIndex = (): IndexesThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { dataService, localAppRegistry, track, connectionInfoAccess }
  ) => {
    const state = getState();
    const spec = {} as CreateIndexSpec;

    // Check for field errors.
    if (
      state.createIndex.fields.some(
        (field: Field) => field.name === '' || field.type === ''
      )
    ) {
      dispatch(handleError('You must select a field name and type'));
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

    // Check for collaction errors.
    const collation =
      isCollationValid((stateOptions.collation.value ?? '') as string) ||
      undefined;

    if (stateOptions.collation.enabled && !collation) {
      dispatch(handleError('You must provide a valid collation object'));
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
          handleError(
            `Bad TTL: "${String(stateOptions.expireAfterSeconds.value)}"`
          )
        );
        return;
      }
    }

    if (stateOptions.wildcardProjection.enabled) {
      try {
        options.wildcardProjection = EJSON.parse(
          (stateOptions.wildcardProjection.value ?? '') as string
        ) as Document;
      } catch (err) {
        dispatch(handleError(`Bad WildcardProjection: ${String(err)}`));
        return;
      }
    }

    if (stateOptions.columnstoreProjection.enabled) {
      try {
        // @ts-expect-error columnstoreProjection is not a part of CreateIndexesOptions yet.
        options.columnstoreProjection = EJSON.parse(
          (stateOptions.columnstoreProjection.value ?? '') as string
        ) as Document;
      } catch (err) {
        dispatch(handleError(`Bad ColumnstoreProjection: ${String(err)}`));
        return;
      }
    }

    if (stateOptions.partialFilterExpression.enabled) {
      try {
        options.partialFilterExpression = EJSON.parse(
          (state.createIndex.options.partialFilterExpression.value ??
            '') as string
        ) as Document;
      } catch (err) {
        dispatch(handleError(`Bad PartialFilterExpression: ${String(err)}`));
        return;
      }
    }

    // Based on current form field value clean up default values from options.
    // This makes a index creation request cleaner and allows to avoid issues in
    // cases where options like `sparse` or `unique` set by the user to `false`
    // explicitly can lead to the server errors for some index types that don't
    // support them (even though technically user is not enabling them)
    for (const optionName of Object.keys(
      stateOptions as Options
    ) as (keyof typeof stateOptions)[]) {
      if (isEmptyValue(stateOptions[optionName].value)) {
        // @ts-expect-error columnstoreProjection is not a part of CreateIndexesOptions yet.
        delete options[optionName];
      }
    }

    dispatch(clearError());
    dispatch(toggleInProgress(true));

    const ns = state.namespace;
    const inProgressIndex = prepareIndex({ ns, name: options.name, spec });

    localAppRegistry.emit('in-progress-indexes-added', inProgressIndex);

    const trackEvent = {
      unique: options.unique,
      ttl: stateOptions.expireAfterSeconds.enabled,
      columnstore_index: hasColumnstoreIndex(
        state.createIndex.fields as Field[]
      ),
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
      track(
        'Index Created',
        trackEvent,
        connectionInfoAccess.getCurrentConnectionInfo()
      );
      dispatch(resetForm());
      dispatch(toggleInProgress(false));
      dispatch(toggleIsVisible(false));
      localAppRegistry.emit('in-progress-indexes-removed', inProgressIndex.id);
      localAppRegistry.emit('refresh-regular-indexes');
    } catch (err) {
      dispatch(toggleInProgress(false));
      dispatch(handleError((err as Error).message));
      localAppRegistry.emit('in-progress-indexes-failed', {
        inProgressIndexId: inProgressIndex.id,
        error: (err as Error).message,
      });
    }
  };
};

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  // fields
  if (isAction<AddFieldAction>(action, ActionTypes.AddField)) {
    return {
      ...state,
      fields: [...state.fields, { name: '', type: '' }],
    };
  }
  if (isAction<RemoveFieldAction>(action, ActionTypes.RemoveField)) {
    const fields = [...state.fields];
    fields.splice(action.idx, 1);
    return {
      ...state,
      fields,
    };
  }
  if (isAction<UpdateFieldTypeAction>(action, ActionTypes.UpdateFieldType)) {
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
  if (isAction<ChangeFieldsAction>(action, ActionTypes.ChangeFields)) {
    return {
      ...state,
      fields: action.fields,
    };
  }
  if (action.type === RESET_FORM) {
    return INITIAL_STATE;
  }

  // options
  if (isAction<ChangeOptionAction>(action, ActionTypes.ChangeOption)) {
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
  if (
    isAction<ChangeOptionEnabledAction>(action, ActionTypes.ChangeOptionEnabled)
  ) {
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

  // other
  if (isAction<ToggleInProgressAction>(action, ActionTypes.ToggleInProgress)) {
    return {
      ...state,
      inProgress: action.inProgress,
    };
  }
  if (isAction<ToggleIsVisibleAction>(action, ActionTypes.ToggleIsVisible)) {
    return {
      ...state,
      isVisible: action.isVisible,
    };
  }
  if (isAction<HandleErrorAction>(action, ActionTypes.HandleError)) {
    return {
      ...state,
      error: action.error,
    };
  }
  if (
    isAction<ClearErrorAction>(action, ActionTypes.ClearError) ||
    action.type === RESET_FORM
  ) {
    return {
      ...state,
      error: null,
    };
  }
  if (action.type === RESET_FORM) {
    // Deep clone on reset
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  return state;
};

export default reducer;
