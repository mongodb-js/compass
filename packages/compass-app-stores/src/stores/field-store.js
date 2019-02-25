const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const parseSchema = require('mongodb-schema');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:field-store');

const FIELDS = [
  'name',
  'path',
  'count',
  'type'
];

const ONE = 1;
const FIELD = 'field';
const VERSION_ZERO = '0.0.0';

const FieldStore = Reflux.createStore({
  mixins: [StateMixin.store],

  onActivated(appRegistry) {
    // process documents when CRUD store resets (first 20 docs)
    appRegistry.on('documents-refreshed', (view, docs) => {
      this.processSingleDocument(docs[0] || {});
    });
    // process new document a user inserts
    appRegistry.on('document-inserted', (view, doc) => {
      this.processSingleDocument(doc);
    });
    appRegistry.on('documents-paginated', (view, docs) => {
      this.processSingleDocument(docs[0] || {});
    });
    // optionally also subscribe to the SchemaStore if present
    const schemaStore = appRegistry.getStore('Schema.Store');
    if (schemaStore) {
      schemaStore.listen((state) => {
        if (state.samplingState === 'complete') {
          this.processSchema(state.schema);
        }
      });
    }

    appRegistry.on('collection-changed', this.onCollectionChanged.bind(this));
    appRegistry.on('database-changed', this.onDatabaseChanged.bind(this));
    appRegistry.on('data-service-disconnected', this.onDisconnected.bind(this));
  },

  onDisconnected() {
    this.setState(this.getInitialState());
  },

  /**
   * Initialize the field store.
   *
   * @return {Object}                  the initial store state with properties:
   *
   * @property {Object} fields         flattened list of fields
   * @property {Array} topLevelFields  array of names of top level fields
   *
   */
  getInitialState() {
    return {
      fields: {},
      topLevelFields: [],
      aceFields: []
    };
  },

  _mergeFields(existingField, newField) {
    return _.merge(existingField, newField,
      function(objectValue, sourceValue, key) {
        if (key === 'count') {
          // counts add up
          return _.isNumber(objectValue) ? objectValue + sourceValue : sourceValue;
        }
        if (key === 'type') {
          // Avoid the merge of 'Array' with 'Array' case becoming
          // an array with a single value, i.e. ['Array']
          if (objectValue === sourceValue) {
            return objectValue;
          }
          // arrays concatenate and de-duplicate
          if (_.isString(objectValue)) {
            return _.uniq([objectValue, sourceValue]);
          }
          return _.isArray(objectValue) ? _.uniq(objectValue.concat(sourceValue)) : sourceValue;
        }
        // all other keys are handled as per default
        return undefined;
      });
  },

  /**
   * Generate the flattened list of fields for the FieldStore.
   *
   * @param  {Object} fields       flattened list of fields
   * @param  {Array} nestedFields  sub-fields of topLevelFields (if existing)
   * @param  {Object} rootField    current top level field which can contain nestedFields
   * @param  {Number} arrayDepth   track depth of the dimensionality recursion
   */
  _flattenedFields(fields, nestedFields, rootField, arrayDepth = 1) {
    if (!nestedFields) {
      return;
    }

    if (rootField) {
      if (!fields[rootField.path].hasOwnProperty('nestedFields')) {
        fields[rootField.path].nestedFields = [];
      }
      nestedFields.map((f) => {
        if (!_.includes(fields[rootField.path].nestedFields, f.path)) {
          fields[rootField.path].nestedFields.push(f.path);
        }
      });
    }

    for (const field of nestedFields) {
      const existingField = fields[field.path] || {};
      const newField = _.pick(field, FIELDS);
      fields[field.path] = this._mergeFields(existingField, newField);

      // recursively search arrays and subdocuments
      for (const type of field.types) {
        if (type.name === 'Document') {
          // add nested sub-fields
          this._flattenedFields(fields, type.fields, field);
        }
        if (type.name === 'Array') {
          // add arrays of arrays or subdocuments
          this._flattenedArray(fields, type.types, field, arrayDepth);
        }
      }
    }
  },

  /**
   * Helper to recurse into the "types" of the mongodb-schema superstructure.
   *
   * @param {Object} fields      flattened list of fields to mutate
   * @param {Array} nestedTypes  the "types" array currently being inspected
   * @param {Object} field       current top level field on which to
   *                             mutate dimensionality
   * @param {Number} arrayDepth  track depth of the dimensionality recursion
   */
  _flattenedArray(fields, nestedTypes, field, arrayDepth) {
    fields[field.path].dimensionality = arrayDepth;

    // Arrays have no name, so can only recurse into arrays or subdocuments
    for (const type of nestedTypes) {
      if (type.name === 'Document') {
        // recurse into nested sub-fields
        this._flattenedFields(fields, type.fields, field);
      }
      if (type.name === 'Array') {
        // recurse into nested arrays (again)
        this._flattenedArray(fields, type.types, field, arrayDepth + 1);
      }
    }
  },

  /**
   * merges a schema with the existing FieldStore content.
   *
   * @param  {Object} schema  schema to process and merge
   */
  _mergeSchema(schema) {
    const fields = _.cloneDeep(this.state.fields);
    const topLevelFields = [];

    for (const field of schema.fields) {
      const name = field.name;
      topLevelFields.push(name);
    }

    this._flattenedFields(fields, schema.fields);

    require('marky').mark('FieldStore - Merge schema');
    this.setState({
      fields: fields,
      topLevelFields: _.union(this.state.topLevelFields, topLevelFields),
      aceFields: this._processAceFields(fields)
    });
    require('marky').stop('FieldStore - Merge schema');
  },

  /**
   * Processes the fields in a format compatible with the ACE editor
   * autocompleter.
   *
   * @param {Object} fields - The fields.
   *
   * @returns {Array} The array of autocomplete metadata.
   */
  _processAceFields(fields) {
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
  },

  /**
   * resets the FieldStore when the namespace changes.
   */
  onCollectionChanged() {
    this.setState(this.getInitialState());
  },

  onDatabaseChanged() {
    this.setState(this.getInitialState());
  },

  /**
   * processes documents returned from the document list
   *
   * @param  {Array} documents  documents to process.
   */
  processDocuments(documents) {
    require('marky').mark('FieldStore - Process Documents');
    parseSchema(documents, {storeValues: false}, (err, schema) => {
      if (err) {
        return;
      }
      this._mergeSchema(schema);
      require('marky').stop('FieldStore - Process Documents');
    });
  },

  /**
   * processes a single document returned from inserting a document.
   *
   * @param  {Object} document     document to process.
   */
  processSingleDocument(document) {
    this.processDocuments([ document ]);
  },

  /**
   * processes a schema from the SchemaStore.
   *
   * @param  {Array} schema     the schema to merge with the existing state.
   */
  processSchema(schema) {
    this._mergeSchema(schema);
  },

  storeDidUpdate(prevState) {
    debug('field store changed from', prevState, 'to', this.state);
  }
});

module.exports = FieldStore;
