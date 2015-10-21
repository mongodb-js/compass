var State = require('ampersand-state');
var Connection = require('../../models/connection');

var SslOption = State.extend({
  namespace: 'SslOption',
  mainIndex: '_id',
  props: {
    _id: {
        type: 'string',
        values: Connection.SSL_VALUES,
        default: Connection.SSL_DEFAULT
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
    },
    /**
     * @property {Array<InputView>} fields - Form fields
     * @see ./src/connect/ssl.js
     */
    fields: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  }
});

module.exports = SslOption;
