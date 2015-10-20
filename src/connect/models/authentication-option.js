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
