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
      fields: {},
      rootFields: []
    };
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
      fields[field.path] = _.pick(field, FIELDS);

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

  onSchemaStoreChanged(state) {
    // skip if schema is null or sampling is incomplete
    if (!state.schema || state.samplingState !== 'complete') {
      return;
    }

    const fields = {};
    const rootFields = [];

    for (const field of state.schema.fields) {
      rootFields.push(field.name);
    }

    this._generateFields(fields, state.schema.fields);

    this.setState({fields: fields, rootFields: rootFields});
  },

  storeDidUpdate(prevState) {
    debug('field store changed from', prevState, 'to', this.state);
  }
});

module.exports = FieldStore;
