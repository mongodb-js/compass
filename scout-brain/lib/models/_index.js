module.exports = require('ampersand-model').extend({
  idAttribute: '_id',
  props: {
    key: 'object',
    name: 'string',
    ns: 'string',
    v: 'number',
    size: 'number'
  },
  derived: {
    _id: {
      deps: ['name', 'ns'],
      fn: function() {
        return this.ns + '.' + this.name;
      }
    }
  }
});
