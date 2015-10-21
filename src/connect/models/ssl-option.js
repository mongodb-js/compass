var State = require('ampersand-state');
var Connection = require('../../models/connection');

var SslOption = State.extend({
  namespace: 'SslOption',
  mainIndex: '_id',
  props: {
    _id: {
      type: Connection.dataTypes.ssl
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
  }
});

module.exports = SslOption;
