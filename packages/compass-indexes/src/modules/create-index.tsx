import type { Document } from 'mongodb';
import { EJSON, ObjectId } from 'bson';
import type { CreateIndexesOptions, IndexDirection } from 'mongodb';
import { isCollationValid } from 'mongodb-query-parser';
import React from 'react';
import type { Action, Dispatch, Reducer } from 'redux';
import { Badge, Link } from '@mongodb-js/compass-components';
import { isAction } from '../utils/is-action';
import type { IndexesThunkAction, RootState } from '.';
import { createRegularIndex } from './regular-indexes';
import * as mql from 'mongodb-mql-engines';
import _parseShellBSON, { ParseMode } from '@mongodb-js/shell-bson-parser';
import toNS from 'mongodb-ns';

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

  // Query Flow
  SuggestedIndexesRequested = 'compass-indexes/create-index/suggested-indexes-requested',
  SuggestedIndexesFetched = 'compass-indexes/create-index/suggested-indexes-fetched',
  QueryUpdatedAction = 'compass-indexes/create-index/clear-has-query-changes',

  // Index Flow
  CoveredQueriesFetched = 'compass-indexes/create-index/covered-queries-fetched',
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
  initialQuery?: Document;
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
        Building an index in a rolling fashion reduces the resiliency of your
        cluster and increases index build times. We only recommend using rolling
        index builds when regular index builds do not meet your needs.{' '}
        <Link href="https://www.mongodb.com/docs/manual/core/rolling-index-builds/">
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

export type IndexSuggestionState = 'initial' | 'fetching' | 'success' | 'error';

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

  // state of the index suggestions
  fetchingSuggestionsState: IndexSuggestionState;

  // index suggestions in a format such as {fieldName: 1}
  indexSuggestions: Record<string, number> | null;

  // sample documents used for getting index suggestions
  sampleDocs: Array<Document> | null;

  // base query to be used for query flow index creation
  query: string;

  // the initial query that user had prefilled from the insights nudge in the documents tab
  initialQuery: string;

  // to determine whether there has been new query changes since user last pressed the button
  hasQueryChanges: boolean;

  // covered queries array for the index flow to keep track of what the user last sees after pressing the covered queries button
  coveredQueriesArr: Array<Record<string, number>> | null;

  // to determine whether there has been new index field changes since user last pressed the button
  hasIndexFieldChanges: boolean;
};

export const INITIAL_STATE: State = {
  indexId: new ObjectId().toHexString(),
  isVisible: false,
  error: null,
  fields: INITIAL_FIELDS_STATE,
  options: INITIAL_OPTIONS_STATE,
  currentTab: 'IndexFlow',

  // Query flow
  fetchingSuggestionsState: 'initial',
  indexSuggestions: null,
  sampleDocs: null,
  query: '',
  initialQuery: '',
  hasQueryChanges: false,

  // Index flow
  coveredQueriesArr: null,
  hasIndexFieldChanges: false,
};

function getInitialState(): State {
  return {
    ...JSON.parse(JSON.stringify(INITIAL_STATE)),
    indexId: new ObjectId().toHexString(),
  };
}

//-------

export const createIndexOpened = (
  initialQuery?: Document
): IndexesThunkAction<
  Promise<void>,
  SuggestedIndexFetchedAction | CreateIndexOpenedAction
> => {
  return async (dispatch) => {
    dispatch({
      type: ActionTypes.CreateIndexOpened,
      initialQuery,
    });

    if (initialQuery) {
      await dispatch(
        fetchIndexSuggestions({
          query: JSON.stringify(initialQuery, null, 2) || '',
        })
      );
    }
  };
};

export const createIndexClosed = () => ({
  type: ActionTypes.CreateIndexClosed,
});

export const errorEncountered = (error: string): ErrorEncounteredAction => ({
  type: ActionTypes.ErrorEncountered,
  error,
});

export const errorCleared = (): ErrorClearedAction => ({
  type: ActionTypes.ErrorCleared,
});

export type CreateIndexSpec = {
  [key: string]: string | number;
};

type SuggestedIndexesRequestedAction = {
  type: ActionTypes.SuggestedIndexesRequested;
};

export type SuggestedIndexFetchedAction = {
  type: ActionTypes.SuggestedIndexesFetched;
  sampleDocs: Array<Document>;
  indexSuggestions: { [key: string]: number } | null;
  error: string | null;
  indexSuggestionsState: IndexSuggestionState;
};

export type SuggestedIndexFetchedProps = {
  query: string;
};

export type CoveredQueriesFetchedAction = {
  type: ActionTypes.CoveredQueriesFetched;
};

export type QueryUpdatedProps = {
  query: string;
};

export type QueryUpdatedAction = {
  type: ActionTypes.QueryUpdatedAction;
  query: string;
};

export const fetchIndexSuggestions = ({
  query,
}: SuggestedIndexFetchedProps): IndexesThunkAction<
  Promise<void>,
  SuggestedIndexFetchedAction | SuggestedIndexesRequestedAction
> => {
  return async (dispatch, getState, { dataService, track }) => {
    dispatch({
      type: ActionTypes.SuggestedIndexesRequested,
    });

    const namespace = getState().namespace;
    // Get sample documents from state if it's already there, otherwise fetch it
    let sampleDocuments: Array<Document> | null =
      getState().createIndex.sampleDocs || null;
    // If it's null, that means it has not been fetched before
    if (sampleDocuments === null) {
      try {
        sampleDocuments =
          (await dataService.sample(namespace, { size: 50 })) || [];
      } catch {
        // Swallow the error because mql package still will work fine with empty sampleDocuments
        sampleDocuments = [];
      }
    }

    const throwError = (e?: unknown) => {
      dispatch({
        type: ActionTypes.SuggestedIndexesFetched,
        sampleDocs: sampleDocuments || [],
        indexSuggestions: null,
        error:
          e instanceof Error
            ? 'Error parsing query. Please follow query structure. ' + e.message
            : 'Error parsing query. Please follow query structure.',
        indexSuggestionsState: 'error',
      });
    };

    // Analyze namespace and fetch suggestions
    try {
      const { database, collection } = toNS(getState().namespace);
      const analyzedNamespace = mql.analyzeNamespace(
        { database, collection },
        sampleDocuments
      );

      const parsedQuery = mql.parseQuery(
        _parseShellBSON(query, { mode: ParseMode.Loose }),
        analyzedNamespace
      );
      const results = await mql.suggestIndex([parsedQuery]);
      const indexSuggestions = results?.index;

      if (
        !indexSuggestions ||
        Object.keys(indexSuggestions as Record<string, unknown>).length === 0
      ) {
        throwError();
        return;
      }

      dispatch({
        type: ActionTypes.SuggestedIndexesFetched,
        sampleDocs: sampleDocuments,
        indexSuggestions,
        error: null,
        indexSuggestionsState: 'success',
      });
    } catch (e: unknown) {
      // TODO: remove this in CLOUDP-320224
      track('Error parsing query', { context: 'Create Index Modal' });
      throwError(e);
    }
  };
};

export const fetchCoveredQueries = (): CoveredQueriesFetchedAction => ({
  type: ActionTypes.CoveredQueriesFetched,
});

export const queryUpdated = ({
  query,
}: QueryUpdatedProps): QueryUpdatedAction => ({
  type: ActionTypes.QueryUpdatedAction,
  query,
});

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
    const isQueryFlow = currentTab === 'QueryFlow';
    const indexSuggestions = getState().createIndex.indexSuggestions;
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

    const formIndexOptions = getState().createIndex.options;

    let spec: Record<string, IndexDirection> = {};

    try {
      if (isQueryFlow) {
        // Gather from suggested index
        if (indexSuggestions) {
          spec = indexSuggestions;
        }
      } else {
        // Gather from the index input fields
        spec = Object.fromEntries(
          getState().createIndex.fields.map((field) => {
            return [field.name, fieldTypeToIndexDirection(field.type)];
          })
        );
      }
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
      hasIndexFieldChanges: true,
      error: null,
    };
  }

  if (isAction<FieldRemovedAction>(action, ActionTypes.FieldRemoved)) {
    const fields = [...state.fields];
    fields.splice(action.idx, 1);
    return {
      ...state,
      fields,
      hasIndexFieldChanges: true,
      error: null,
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
      hasIndexFieldChanges: true,
      error: null,
    };
  }

  if (isAction<FieldsChangedAction>(action, ActionTypes.FieldsChanged)) {
    return {
      ...state,
      fields: action.fields,
      hasIndexFieldChanges: true,
      error: null,
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
    const parsedInitialQuery = action.initialQuery
      ? JSON.stringify(action.initialQuery, null, 2)
      : '';

    return {
      ...getInitialState(),
      isVisible: true,
      // get it from the current query or initial query from insights nudge
      query: state.query || parsedInitialQuery,
      initialQuery: parsedInitialQuery,
      currentTab: action.initialQuery ? 'QueryFlow' : 'IndexFlow',
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
      query: '',
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

  if (
    isAction<SuggestedIndexesRequestedAction>(
      action,
      ActionTypes.SuggestedIndexesRequested
    )
  ) {
    return {
      ...state,
      fetchingSuggestionsState: 'fetching',
      error: null,
      indexSuggestions: null,
    };
  }

  if (
    isAction<SuggestedIndexFetchedAction>(
      action,
      ActionTypes.SuggestedIndexesFetched
    )
  ) {
    return {
      ...state,
      fetchingSuggestionsState: action.indexSuggestionsState,
      error: action.error,
      indexSuggestions: action.indexSuggestions,
      sampleDocs: action.sampleDocs,
      hasQueryChanges: false,
    };
  }

  if (
    isAction<CoveredQueriesFetchedAction>(
      action,
      ActionTypes.CoveredQueriesFetched
    )
  ) {
    return {
      ...state,
      coveredQueriesArr: state.fields.map((field, index) => {
        return { [field.name]: index + 1 };
      }),
      hasIndexFieldChanges: false,
    };
  }

  if (isAction<QueryUpdatedAction>(action, ActionTypes.QueryUpdatedAction)) {
    return {
      ...state,
      query: action.query,
      hasQueryChanges: true,
      error: null,
    };
  }

  return state;
};

export default reducer;
