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
    this.listenToExternalStore('CRUD.ResetDocumentListStore', this.parseDocuments.bind(this));
    this.listenToExternalStore('CRUD.LoadMoreDocumentsStore', this.parseDocuments.bind(this));
    NamespaceStore.listen(this.onNamespaceChanged.bind(this));
  },

  /**
   * Initialize the field store.
   * @param {Object} fields    flat list of fields (including sub-fields) from SchemaStore keyed by field path
   * @param {Array} rootFields top level fields (non-sub-fields) in fields object
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

  onNamespaceChanged() {
    this.setState(this.getInitialState());
  },

  parseDocuments(error, documents) {
    // skip if the document store returns an error
    if (error) {
      return;
    }

    const fields = _.cloneDeep(this.state.fields);
    const rootFields = [];
    const t = new Date();
    parseSchema(documents, {storeValues: false}, (err, schema) => {
      if (err) {
        return;
      }
      for (const field of schema.fields) {
        rootFields.push(field.name);
      }
      this._generateFields(fields, schema.fields);

      debug('light schema sampling took %i ms', new Date() - t);
      this.setState({
        fields: fields,
        rootFields: _.union(this.state.rootFields, rootFields)
      });
    });
  },

  storeDidUpdate(prevState) {
    debug('field store changed from', prevState, 'to', this.state);
  }
});

module.exports = FieldStore;
