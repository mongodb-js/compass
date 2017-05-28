const State = require('ampersand-state');
const Connection = require('mongodb-connection-model');

const ReadPreferenceOption = State.extend({
  namespace: 'ReadPreferenceOption',
  mainIndex: '_id',
  props: {
    _id: {
      type: 'string',
      values: Connection.READ_PREFERENCE_VALUES,
      default: Connection.READ_PREFERENCE_DEFAULT
    },
    title: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    selected: {
      type: 'boolean',
      default: false
    },
    enabled: {
      type: 'boolean',
      default: true
    }
  }
});

module.exports = ReadPreferenceOption;
