var State = require('ampersand-state');

var AuthenticationOption = State.extend({
  namespace: 'AuthenticationOption',
  mainIndex: '_id',
  props: {
    _id: {
      type: 'authentication'
    },
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
  },
  dataTypes: {
    authentication: {
      type: 'string',
      default: 'NONE',
      values: [
        'NONE',
        'MONGODB',
        'KERBEROS',
        'X509',
        'LDAP'
      ]
    }
  }
});

module.exports = AuthenticationOption;
