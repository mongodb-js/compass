var State = require('ampersand-state');

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
  dataTypes: {
    ssl: {
      type: 'string',
      default: 'NONE',
      values: [
        'NONE',
        'UNVALIDATED',
        'SERVER',
        'ALL'
      ]
    }
  }
});

module.exports = SslOption;
