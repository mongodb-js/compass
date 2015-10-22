var State = require('ampersand-state');
var Connection = require('../../models/connection');

var AuthenticationOption = State.extend({
  namespace: 'AuthenticationOption',
  mainIndex: '_id',
  props: {
    _id: Connection.dataTypes.authentication,
    title: {
      type: 'string'
    },
    /**
     * @see ./src/models/selectable-collection-mixin.js
     */
    selected: {
      type: 'boolean',
      default: false
    },
    /**
     * Feature flag to easily hide authentication
     * that aren't fully supported yet.
     */
    enabled: {
      type: 'boolean',
      default: true
    },
    /**
     * @property {Array<InputView>} fields - Form fields
     * needed to use this for authentication.
     * @see ./src/connect/authentication.js
     */
    fields: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  }
});

module.exports = AuthenticationOption;
