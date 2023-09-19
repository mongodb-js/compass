import { EJSON, ObjectId } from 'bson';
import { combineReducers } from 'redux';
import type { Dispatch } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { isCollationValid } from 'mongodb-query-parser';
import type { CreateIndexesOptions, IndexSpecification } from 'mongodb';

import dataService from '../data-service';
import appRegistry, {
  localAppRegistryEmit,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import error, { clearError, handleError } from './error';
import inProgress, { toggleInProgress } from '../in-progress';
import isVisible, { toggleIsVisible } from '../is-visible';
import fields from '../create-index/fields';
import type { IndexField } from '../create-index/fields';
import namespace from '../namespace';
import serverVersion from '../server-version';
import type { InProgressIndex } from '../regular-indexes';

import schemaFields from '../create-index/schema-fields';
import { resetForm } from '../reset-form';

import options from './options';
import { hasColumnstoreIndex } from '../../utils/columnstore-indexes';

const { track } = createLoggerAndTelemetry('COMPASS-INDEXES-UI');

/**
 * The main reducer.
 */
const reducer = combineReducers({
  // global stuff
  dataService,
  appRegistry,
  namespace,
  serverVersion,

  // modal state
  inProgress,
  isVisible,

  // fields realted
  fields,
  schemaFields,

  // validation
  error,

  // index options
  options,
});

export type RootState = ReturnType<typeof reducer>;

export type CreateIndexSpec = {
  [key: string]: string | number;
};

export default reducer;

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

/**
 * The create index action.
 *
 * @returns {Function} The thunk function.
 */
export const createIndex = () => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const spec = {} as CreateIndexSpec;

    // Check for field errors.
    if (
      state.fields.some(
        (field: IndexField) => field.name === '' || field.type === ''
      )
    ) {
      dispatch(handleError('You must select a field name and type'));
      return;
    }

    const stateOptions = state.options;

    state.fields.forEach((field: IndexField) => {
      let type: string | number = field.type;
      if (field.type === '1 (asc)') type = 1;
      if (field.type === '-1 (desc)') type = -1;
      spec[field.name] = type;
    });

    const options: CreateIndexesOptions = {};

    // Check for collaction errors.
    const collation =
      isCollationValid(stateOptions.collation.value ?? '') || undefined;

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
          stateOptions.wildcardProjection.value ?? ''
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
          stateOptions.columnstoreProjection.value ?? ''
        ) as Document;
      } catch (err) {
        dispatch(handleError(`Bad ColumnstoreProjection: ${String(err)}`));
        return;
      }
    }

    if (stateOptions.partialFilterExpression.enabled) {
      try {
        options.partialFilterExpression = EJSON.parse(
          state.options.partialFilterExpression.value ?? ''
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
      stateOptions
    ) as (keyof typeof stateOptions)[]) {
      if ([false, ''].includes(stateOptions[optionName].value)) {
        // @ts-expect-error because columnstoreProjection is not supported yet
        delete options[optionName];
      }
    }

    dispatch(clearError());
    dispatch(toggleInProgress(true));

    const ns = state.namespace;
    const inProgressIndex = prepareIndex({ ns, name: options.name, spec });

    dispatch(
      localAppRegistryEmit('in-progress-indexes-added', inProgressIndex)
    );

    const trackEvent = {
      unique: options.unique,
      ttl: stateOptions.expireAfterSeconds.enabled,
      columnstore_index: hasColumnstoreIndex(state.fields),
      has_columnstore_projection: stateOptions.columnstoreProjection.enabled,
      has_wildcard_projection: stateOptions.wildcardProjection.enabled,
      custom_collation: stateOptions.collation.enabled,
      geo:
        state.fields.filter(({ type }: { type: string }) => type === '2dsphere')
          .length > 0,
      atlas_search: false,
    };

    try {
      await state.dataService?.createIndex(
        ns,
        spec as IndexSpecification,
        options
      );
      track('Index Created', trackEvent);
      dispatch(resetForm());
      dispatch(toggleInProgress(false));
      dispatch(toggleIsVisible(false));
      dispatch(
        localAppRegistryEmit('in-progress-indexes-removed', inProgressIndex.id)
      );
      dispatch(localAppRegistryEmit('refresh-regular-indexes'));
    } catch (err) {
      dispatch(toggleInProgress(false));
      dispatch(handleError((err as Error).message));
      dispatch(
        localAppRegistryEmit('in-progress-indexes-failed', {
          inProgressIndexId: inProgressIndex.id,
          error: (err as Error).message,
        })
      );
    }
  };
};
