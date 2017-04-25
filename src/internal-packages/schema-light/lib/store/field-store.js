const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const parseSchema = require('mongodb-schema');
const { NamespaceStore } = require('hadron-reflux-store');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:field-store');

const FIELDS = [
  'name',
  'path',
  'count',
  'type'
];

const FieldStore = Reflux.createStore({
  mixins: [StateMixin.store],

  init: function() {
    this.listenToExternalStore('CRUD.ResetDocumentListStore', this.processDocuments.bind(this));
    this.listenToExternalStore('CRUD.LoadMoreDocumentsStore', this.processDocuments.bind(this));
    this.listenToExternalStore('CRUD.InsertDocumentStore', this.processSingleDocument.bind(this));
    NamespaceStore.listen(this.onNamespaceChanged.bind(this));
  },

  /**
   * Initialize the field store.
   *
   * @param {Object} fields    flattened list of fields
   * @param {Array} rootFields array of names of top level fields
   *
   * @return {Object}          the initial field store.
   */
  getInitialState() {
    return {
      fields: {},
      rootFields: []
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
          // arrays concatenate and de-dupe
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
   * @todo Satya to fill out what these are.
   *
   * @param  {[type]} fields       [description]
   * @param  {[type]} nestedFields [description]
   * @param  {[type]} rootField    [description]
   */
  _generateFields(fields, nestedFields, rootField) {
    if (!nestedFields) {
      return;
    }

    if (rootField) {
      if (!fields[rootField.path].hasOwnProperty('nestedFields')) {
        fields[rootField.path].nestedFields = [];
      }
      nestedFields.map((f) => {
        fields[rootField.path].nestedFields.push(f.path);
      });
    }

    for (const field of nestedFields) {
      const existingField = _.get(fields, field.path, {});
      const newField = _.pick(field, FIELDS);
      fields[field.path] = this._mergeFields(existingField, newField);

      // recursively search sub documents
      for (const type of field.types) {
        if (type.name === 'Document') {
          // add nested sub-fields
          this._generateFields(fields, type.fields, field);
        }
        if (type.name === 'Array') {
          // add nested sub-fields of document type
          const docType = _.find(type.types, 'name', 'Document');
          if (docType) {
            this._generateFields(fields, docType.fields, field);
          }
        }
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
    const rootFields = [];

    for (const field of schema.fields) {
      rootFields.push(field.name);
    }
    this._generateFields(fields, schema.fields);

    this.setState({
      fields: fields,
      rootFields: _.union(this.state.rootFields, rootFields)
    });
  },

  /**
   * resets the FieldStore when the namespace changes.
   */
  onNamespaceChanged() {
    this.setState(this.getInitialState());
  },

  /**
   * processes documents returned from the ResetDocumentListStore and
   * LoadMoreDocumentsStore.
   *
   * @param  {Error} error      possible error passed from the store.
   * @param  {Array} documents  documents to process.
   */
  processDocuments(error, documents) {
    // skip if the document store returns an error
    if (error) {
      return;
    }
    parseSchema(documents, {storeValues: false}, (err, schema) => {
      if (err) {
        return;
      }
      this._mergeSchema(schema);
    });
  },

  /**
   * processes a single document returned from the InsertDocumentStore.
   *
   * @param  {Error} success    whether or not the insert succeeded.
   * @param  {Array} doc        document to process.
   */
  processSingleDocument(success, doc) {
    if (!success) {
      return;
    }
    parseSchema([ doc ], {storeValues: false}, (err, schema) => {
      if (err) {
        return;
      }
      this._mergeSchema(schema);
    });
  },

  storeDidUpdate(prevState) {
    debug('field store changed from', prevState, 'to', this.state);
  }
});

module.exports = FieldStore;
