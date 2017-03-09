const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const SchemaStore = require('../store');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:field-store');

const FIELDS = [
  'name',
  'path',
  'count',
  'type',
  'probability'
];

const FieldStore = Reflux.createStore({
  mixins: [StateMixin.store],

  init: function() {
    SchemaStore.listen(this.onSchemaStoreChanged.bind(this));
  },

  /**
   * Initialize the field store.
   *
   * @return {Object} the initial field store.
   */
  getInitialState() {
    return {
      fields: []
    };
  },

  _generateChildFields(selectedFields, parent, children) {
    if (!children) {
      return;
    }

    if (!selectedFields[parent.path].hasOwnProperty('children')) {
      selectedFields[parent.path].children = [];
    }

    for (const child of children) {
      selectedFields[parent.path].children.push(child.path);
      selectedFields[child.path] = _.pick(child, FIELDS);

      // recursively search sub documents
      for (const type of child.types) {
        if (type.name === 'Document') {
          // add nested sub-fields
          this._generateChildFields(selectedFields, child, type.fields);
        }
        if (type.name === 'Array') {
          // add nested sub-fields of document type
          const docType = _.find(type.types, 'name', 'Document');
          if (docType) {
            this._generateChildFields(selectedFields, child, docType.fields);
          }
        }
      }
    }
  },

  generateFields(fields) {
    const selectedFields = {};

    // add each field's path to field set
    for (const field of fields) {
      selectedFields[field.path] = _.pick(field, FIELDS);

      // recursively search sub documents
      for (const type of field.types) {
        if (type.name === 'Document') {
          // add nested sub-fields to list of index fields
          this._generateChildFields(selectedFields, field, type.fields);
        }
        if (type.name === 'Array') {
          // add nested sub-fields of document type to list of index fields
          const docType = _.find(type.types, 'name', 'Document');
          if (docType) {
            this._generateChildFields(selectedFields, field, docType.fields);
          }
        }
      }
    }

    return selectedFields;
  },

  onSchemaStoreChanged: function(state) {
    // skip if schema is null or sampling is incomplete
    if (!state.schema || state.samplingState !== 'complete') {
      return;
    }

    debug('this is the schema state', state);

    const fields = this.generateFields(state.schema.fields);
    this.setState({fields: fields});
  },

  storeDidUpdate(prevState) {
    debug('field store changed from', prevState, 'to', this.state);
  }
});

module.exports = FieldStore;
