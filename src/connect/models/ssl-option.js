var State = require('ampersand-state');
var Connection = require('../../models/connection');

var SslOption = State.extend({
  namespace: 'SslOption',
  mainIndex: '_id',
  props: {
    _id: {
      type: 'ssl'
    },
    title: {
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
  },
  // To pull in the ENUM used by `SslOption._id`
  dataTypes: {
    ssl: Connection.dataTypes.ssl
  }
});

module.exports = SslOption;
