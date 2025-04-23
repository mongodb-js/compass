import { EJSON, ObjectId } from 'bson';
import type { CreateIndexesOptions, IndexDirection } from 'mongodb';
import { isCollationValid } from 'mongodb-query-parser';
import React from 'react';
import type { Action, Reducer, Dispatch } from 'redux';
import { Badge, Link } from '@mongodb-js/compass-components';
import { isAction } from '../utils/is-action';
import type { IndexesThunkAction } from '.';
import type { RootState } from '.';
import { createRegularIndex } from './regular-indexes';

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

  CreateIndexFormSubmitted = 'compass-indexes/create-index/create-index-form-submitted',

  TabUpdated = 'compass-indexes/create-index/tab-updated',
}

// fields

export type Field = { name: string; type: string };
export type Tab = 'QueryFlow' | 'IndexFlow';

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

/**
 * Emitted only when the form fails client-side validation before being
 * submitted
 */
type ErrorEncounteredAction = {
  type: ActionTypes.ErrorEncountered;
  error: string;
};

type ErrorClearedAction = {
  type: ActionTypes.ErrorCleared;
};

export type CreateIndexOpenedAction = {
  type: ActionTypes.CreateIndexOpened;
};

type CreateIndexClosedAction = {
  type: ActionTypes.CreateIndexClosed;
};

/**
 * Dispatched when the form passed the client validation and the form data was
 * submitted for index creation
 */
type CreateIndexFormSubmittedAction = {
  type: ActionTypes.CreateIndexFormSubmitted;
};

type TabUpdatedAction = {
  type: ActionTypes.TabUpdated;
  currentTab: Tab;
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

export const tabUpdated = (tab: Tab) => ({
  type: ActionTypes.TabUpdated,
  currentTab: tab,
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
  buildInRollingProcess: {
    type: 'checkbox',
    label: 'Build in rolling process',
    description: (
      <>
        Building indexes in a rolling fashion can minimize the performance
        impact of index builds. We only recommend using rolling index builds
        when regular index builds do not meet your needs.{' '}
        <Link href="https://www.mongodb.com/docs/manual/core/index-creation/">
          Learn More
        </Link>
      </>
    ),
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
  // A unique id assigned to the create index modal on open, will be used when
  // creating an instance of in-progress index and can be used to map the index
  // to the form if needed
  indexId: string;

  // Whether or not the modal is open or closed
  isVisible: boolean;

  // Client-side validation error
  error: string | null;

  // form fields related
  fields: Field[];

  // index options
  options: Options;

  // current tab that user is on (Query Flow or Index Flow)
  currentTab: Tab;
};

export const INITIAL_STATE: State = {
  indexId: new ObjectId().toHexString(),
  isVisible: false,
  error: null,
  fields: INITIAL_FIELDS_STATE,
  options: INITIAL_OPTIONS_STATE,
  currentTab: 'IndexFlow',
};

function getInitialState(): State {
  return {
    ...JSON.parse(JSON.stringify(INITIAL_STATE)),
    indexId: new ObjectId().toHexString(),
  };
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

export type CreateIndexSpec = {
  [key: string]: string | number;
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

function fieldTypeToIndexDirection(type: string): IndexDirection {
  if (type === '1 (asc)') {
    return 1;
  }
  if (type === '-1 (desc)') {
    return -1;
  }
  if (type === 'text' || type === '2dsphere') {
    return type;
  }
  throw new Error(`Unsupported field type: ${type}`);
}

export const createIndexFormSubmitted = (): IndexesThunkAction<
  void,
  ErrorEncounteredAction | CreateIndexFormSubmittedAction
> => {
  return (dispatch, getState, { track, preferences }) => {
    // @experiment Early Journey Indexes Guidance & Awareness  | Jira Epic: CLOUDP-239367
    const currentTab = getState().createIndex.currentTab;
    const { enableIndexesGuidanceExp, showIndexesGuidanceVariant } =
      preferences.getPreferences();

    track('Create Index Button Clicked', {
      context: 'Create Index Modal',
      flow:
        enableIndexesGuidanceExp && showIndexesGuidanceVariant
          ? currentTab === 'IndexFlow'
            ? 'Start with Index'
            : 'Start with Query'
          : undefined,
    });

    // Check for field errors.
    if (
      getState().createIndex.fields.some(
        (field: Field) => field.name === '' || field.type === ''
      )
    ) {
      dispatch(errorEncountered('You must select a field name and type'));
      return;
    }

    const formIndexOptions = getState().createIndex.options;

    let spec: Record<string, IndexDirection>;

    try {
      spec = Object.fromEntries(
        getState().createIndex.fields.map((field) => {
          return [field.name, fieldTypeToIndexDirection(field.type)];
        })
      );
    } catch (e) {
      dispatch(errorEncountered((e as any).message));
      return;
    }

    const options: CreateIndexesOptions = {};

    // Check for collation errors.
    const collation =
      isCollationValid(formIndexOptions.collation.value ?? '') || undefined;

    if (formIndexOptions.collation.enabled && !collation) {
      dispatch(errorEncountered('You must provide a valid collation object'));
      return;
    }

    if (formIndexOptions.collation.enabled) {
      options.collation = collation;
    }

    if (formIndexOptions.unique.enabled) {
      options.unique = formIndexOptions.unique.value;
    }

    if (formIndexOptions.sparse.enabled) {
      options.sparse = formIndexOptions.sparse.value;
    }

    // The server will generate a name when we don't provide one.
    if (formIndexOptions.name.enabled && formIndexOptions.name.value) {
      options.name = formIndexOptions.name.value;
    }

    if (formIndexOptions.expireAfterSeconds.enabled) {
      options.expireAfterSeconds = Number(
        formIndexOptions.expireAfterSeconds.value
      );
      if (isNaN(options.expireAfterSeconds)) {
        dispatch(
          errorEncountered(
            `Bad TTL: "${String(formIndexOptions.expireAfterSeconds.value)}"`
          )
        );
        return;
      }
    }

    if (formIndexOptions.wildcardProjection.enabled) {
      try {
        options.wildcardProjection = EJSON.parse(
          formIndexOptions.wildcardProjection.value ?? ''
        ) as Document;
      } catch (err) {
        dispatch(errorEncountered(`Bad WildcardProjection: ${String(err)}`));
        return;
      }
    }

    if (formIndexOptions.columnstoreProjection.enabled) {
      try {
        // @ts-expect-error columnstoreProjection is not a part of CreateIndexesOptions yet.
        options.columnstoreProjection = EJSON.parse(
          formIndexOptions.columnstoreProjection.value ?? ''
        ) as Document;
      } catch (err) {
        dispatch(errorEncountered(`Bad ColumnstoreProjection: ${String(err)}`));
        return;
      }
    }

    if (formIndexOptions.partialFilterExpression.enabled) {
      try {
        options.partialFilterExpression = EJSON.parse(
          formIndexOptions.partialFilterExpression.value ?? ''
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
      formIndexOptions
    ) as (keyof typeof formIndexOptions)[]) {
      if (isEmptyValue(formIndexOptions[optionName].value)) {
        // @ts-expect-error columnstoreProjection is not a part of CreateIndexesOptions yet.
        delete options[optionName];
      }
    }

    dispatch({ type: ActionTypes.CreateIndexFormSubmitted });
    void dispatch(
      createRegularIndex(
        getState().createIndex.indexId,
        spec,
        options,
        !!formIndexOptions.buildInRollingProcess.value
      )
    );
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
      ...getInitialState(),
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
    isAction<CreateIndexFormSubmittedAction>(
      action,
      ActionTypes.CreateIndexFormSubmitted
    )
  ) {
    return {
      ...state,
      isVisible: false,
    };
  }

  if (isAction<TabUpdatedAction>(action, ActionTypes.TabUpdated)) {
    return {
      ...state,
      currentTab: action.currentTab,
    };
  }

  return state;
};

export default reducer;
