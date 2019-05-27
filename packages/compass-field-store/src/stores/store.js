import { createStore } from 'redux';
import mergeWith from 'lodash.mergewith';
import isNumber from 'lodash.isnumber';
import isString from 'lodash.isstring';
import uniq from 'lodash.uniq';
import isArray from 'lodash.isarray';
import includes from 'lodash.includes';
import pick from 'lodash.pick';
import cloneDeep from 'lodash.clonedeep';
import union from 'lodash.union';

import reducer, { changeFields } from 'modules';

import parseSchema from 'mongodb-schema';

const FIELDS = [
  'name',
  'path',
  'count',
  'type'
];

const ONE = 1;
const FIELD = 'field';
const VERSION_ZERO = '0.0.0';

const configureStore = (options = {}) => {
  const store = createStore(reducer);

  store._mergeFields = (existingField, newField) => {
    return mergeWith(
      existingField,
      newField,
      function(objectValue, sourceValue, key) {
        if (key === 'count') {
          // counts add up
          return isNumber(objectValue) ? objectValue + sourceValue : sourceValue;
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
          return isArray(objectValue) ? uniq(objectValue.concat(sourceValue)) : sourceValue;
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
   * @param  {Object} rootField    current top level field which can contain nestedFields
   * @param  {Number} arrayDepth   track depth of the dimensionality recursion
   */
  store._flattenedFields = (fields, nestedFields, rootField, arrayDepth = 1) => {
    if (!nestedFields) {
      return;
    }

    if (rootField) {
      if (!fields[rootField.path].hasOwnProperty('nestedFields')) {
        fields[rootField.path].nestedFields = [];
      }
      nestedFields.map((f) => {
        if (!includes(fields[rootField.path].nestedFields, f.path)) {
          fields[rootField.path].nestedFields.push(f.path);
        }
      });
    }

    for (const field of nestedFields) {
      const existingField = fields[field.path] || {};
      const newField = pick(field, FIELDS);
      fields[field.path] = store._mergeFields(existingField, newField);

      // recursively search arrays and subdocuments
      for (const type of field.types) {
        if (type.name === 'Document') {
          // add nested sub-fields
          store._flattenedFields(fields, type.fields, field);
        }
        if (type.name === 'Array') {
          // add arrays of arrays or subdocuments
          store._flattenedArray(fields, type.types, field, arrayDepth);
        }
      }
    }
  };

  /**
   * Helper to recurse into the "types" of the mongodb-schema superstructure.
   *
   * @param {Object} fields      flattened list of fields to mutate
   * @param {Array} nestedTypes  the "types" array currently being inspected
   * @param {Object} field       current top level field on which to
   *                             mutate dimensionality
   * @param {Number} arrayDepth  track depth of the dimensionality recursion
   */
  store._flattenedArray = (fields, nestedTypes, field, arrayDepth) => {
    fields[field.path].dimensionality = arrayDepth;

    // Arrays have no name, so can only recurse into arrays or subdocuments
    for (const type of nestedTypes) {
      if (type.name === 'Document') {
        // recurse into nested sub-fields
        store._flattenedFields(fields, type.fields, field);
      }
      if (type.name === 'Array') {
        // recurse into nested arrays (again)
        store._flattenedArray(fields, type.types, field, arrayDepth + 1);
      }
    }
  };

  /**
   * Processes the fields in a format compatible with the ACE editor
   * autocompleter.
   *
   * @param {Object} fields - The fields.
   *
   * @returns {Array} The array of autocomplete metadata.
   */
  store._processAceFields = (fields) => {
    return Object.keys(fields).map((key) => {
      const field = (key.indexOf('.') > -1 || key.indexOf(' ') > -1) ? `"${key}"` : key;
      return {
        name: key,
        value: field,
        score: ONE,
        meta: FIELD,
        version: VERSION_ZERO
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
    const aResult = store._processAceFields(fields);
    store.dispatch(changeFields(fields, tlResult, aResult));
  };

  /**
   * processes documents returned from the ResetDocumentListStore and
   * LoadMoreDocumentsStore.
   *
   * @param  {Array} documents  documents to process.
   */
  store.processDocuments = (documents) => {
    parseSchema(documents, {storeValues: false}, (err, schema) => {
      if (err) {
        return;
      }
      store._mergeSchema(schema);
    });
  };

  /**
   * processes a single document returned from the InsertDocumentStore.
   *
   * @param  {Object} document     document to process.
   */
  store.processSingleDocument = (document) => {
    store.processDocuments([ document ]);
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

    appRegistry.on('documents-refreshed', (view, docs) => {
      store.processSingleDocument(docs[0] || {});
    });

    // process new document a user inserts
    appRegistry.on('document-inserted', (view, doc) => {
      store.processSingleDocument(doc);
    });

    appRegistry.on('documents-paginated', (view, docs) => {
      store.processSingleDocument(docs[0] || {});
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
