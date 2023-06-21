import { createStore } from 'redux';
import {
  mergeWith,
  isNumber,
  isString,
  uniq,
  isArray,
  pick,
  cloneDeep,
  union,
} from 'lodash';
import reducer, { changeFields } from '../modules';

import parseSchema from 'mongodb-schema';

const FIELDS = ['name', 'path', 'count', 'type'];

const ONE = 1;
const FIELD = 'field';
const VERSION_ZERO = '0.0.0';

/**
 * For the field store we generate a flattened map of path strings
 * for autocompletion. We generate the path
 * id strings by joining field paths with dots, this means we can
 * have collisions when there are field names with dots in them.
 */
function getFlattenedPathIdString(path) {
  return path.join('.');
}

const configureStore = (options = {}) => {
  const store = createStore(reducer);

  store._mergeFields = (existingField, newField) => {
    return mergeWith(
      existingField,
      newField,
      function (objectValue, sourceValue, key) {
        if (key === 'count') {
          // counts add up
          return isNumber(objectValue)
            ? objectValue + sourceValue
            : sourceValue;
        }
        if (key === 'type') {
          // Avoid the merge of 'Array' with 'Array' case becoming
          // an array with a single value, i.e. ['Array']
          if (objectValue === sourceValue) {
            return objectValue;
          }
          // arrays concatenate and de-duplicate
          if (isString(objectValue)) {
            return uniq([objectValue, sourceValue]);
          }
          return isArray(objectValue)
            ? uniq(objectValue.concat(sourceValue))
            : sourceValue;
        }
        // all other keys are handled as per default
        return undefined;
      }
    );
  };

  /**
   * Generate the flattened list of fields for the FieldStore.
   *
   * @param  {Object} fields       flattened list of fields
   * @param  {Array} nestedFields  sub-fields of topLevelFields (if existing)
   */
  store._flattenedFields = (fields, nestedFields) => {
    if (!nestedFields) {
      return;
    }

    for (const field of nestedFields) {
      const fieldPathId = getFlattenedPathIdString(field.path);

      const existingField = fields[fieldPathId] || {};
      const newField = pick(field, FIELDS);
      fields[fieldPathId] = store._mergeFields(existingField, newField);

      // recursively search arrays and subdocuments
      for (const type of field.types) {
        if (type.name === 'Document') {
          // add nested sub-fields
          store._flattenedFields(fields, type.fields);
        }
        if (type.name === 'Array') {
          // add arrays of arrays or subdocuments
          store._flattenedArray(fields, type.types);
        }
      }
    }
  };

  /**
   * Helper to recurse into the "types" of the mongodb-schema superstructure.
   *
   * @param {Object} fields      flattened list of fields to mutate
   * @param {Array} nestedTypes  the "types" array currently being inspected
   */
  store._flattenedArray = (fields, nestedTypes) => {
    // Arrays have no name, so can only recurse into arrays or subdocuments
    for (const type of nestedTypes) {
      if (type.name === 'Document') {
        // recurse into nested sub-fields
        store._flattenedFields(fields, type.fields);
      }
      if (type.name === 'Array') {
        // recurse into nested arrays (again)
        store._flattenedArray(fields, type.types);
      }
    }
  };

  /**
   * Processes the fields in a format compatible with an autocompleter.
   *
   * @param {Object} fields - The fields.
   *
   * @returns {Array} The array of autocomplete metadata.
   */
  store._processFieldsForAutocomplete = (fields) => {
    return Object.keys(fields).map((key) => {
      const field =
        key.indexOf('.') > -1 || key.indexOf(' ') > -1 ? `"${key}"` : key;
      return {
        name: key,
        value: field,
        score: ONE,
        meta: FIELD,
        version: VERSION_ZERO,
        description: Array.isArray(fields[key].type)
          ? fields[key].type.join(' | ')
          : fields[key].type,
      };
    });
  };

  /**
   * merges a schema with the existing FieldStore content.
   *
   * @param  {Object} schema  schema to process and merge
   */
  store._mergeSchema = (schema) => {
    const fields = cloneDeep(store.getState().fields);
    const topLevelFields = [];

    for (const field of schema.fields) {
      const name = field.name;
      topLevelFields.push(name);
    }
    store._flattenedFields(fields, schema.fields);

    const tlResult = union(store.getState().topLevelFields, topLevelFields);
    const aResult = store._processFieldsForAutocomplete(fields);
    store.dispatch(changeFields(fields, tlResult, aResult));
  };

  /**
   * processes documents returned from the ResetDocumentListStore and
   * LoadMoreDocumentsStore.
   *
   * @param  {Array} documents  documents to process.
   */
  store.processDocuments = async (documents) => {
    try {
      const schema = await parseSchema(documents, { storeValues: false });

      store._mergeSchema(schema);
    } catch (err) {
      return;
    }
  };

  /**
   * processes a single document returned from the InsertDocumentStore.
   *
   * @param  {Object} document     document to process.
   */
  store.processSingleDocument = (document) => {
    store.processDocuments([document]);
  };

  /**
   * processes a schema from the SchemaStore.
   *
   * @param  {Array} schema     the schema to merge with the existing state.
   */
  store.processSchema = (schema) => {
    store._mergeSchema(schema);
  };

  if (options.localAppRegistry) {
    const appRegistry = options.localAppRegistry;

    appRegistry.on('documents-refreshed', (doc = {}) => {
      store.processSingleDocument(doc);
    });

    // process new document a user inserts
    appRegistry.on('document-inserted', ({ docs }) => {
      store.processSingleDocument(docs[0] || {});
    });

    appRegistry.on('documents-paginated', (doc = {}) => {
      store.processSingleDocument(doc);
    });

    // optionally also subscribe to the SchemaStore if present
    const schemaStore = appRegistry.getStore('Schema.Store');
    if (schemaStore) {
      schemaStore.listen((state) => {
        if (state.samplingState === 'complete') {
          store.processSchema(state.schema);
        }
      });
    }

    store.subscribe(() => {
      const state = store.getState();
      appRegistry.emit('fields-changed', state);
    });
  }

  return store;
};

export default configureStore;
