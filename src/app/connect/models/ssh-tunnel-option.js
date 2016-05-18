var State = require('ampersand-state');

var SSHTunnelOption = State.extend({
  namespace: 'SSHTunnelOption',
  mainIndex: '_id',
  props: {
    /**
     * @todo: Durran: Move into connection model constant.
     */
    _id: {
      type: 'string',
      values: ['NONE', 'USER_PASSWORD', 'IDENTITY_FILE'],
      default: 'NONE'
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
    fields: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  }
});

module.exports = SSHTunnelOption;
