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

  onSchemaStoreChanged: function(state) {
    // skip if schema is null
    if (!state.schema) {
      return;
    }

    // pick out the required fields
    const schemaFields = state.schema.fields.map((field) => {
      return _.pick(field, FIELDS);
    });

    // if the newly picked schemafields is different to current state set it
    if (!_.isEqual(schemaFields, this.state.fields)) {
      this.setState({fields: schemaFields});
    }
  },

  storeDidUpdate(prevState) {
    debug('field store changed from', prevState, 'to', this.state);
  }
});

module.exports = FieldStore;
