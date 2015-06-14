var AmpersandState = require('ampersand-state'),
    _ = require('lodash');

/**
 * Schema implementation using mongodb-schema output with
 * {data: true, flat: true, metavars: {prefix: '#'}}
 */
var Schema = module.exports = AmpersandState.extend({
  extraProperties: 'reject',
  idAttribute: 'namespace',
  props: {
    namespace: {
      type: 'string',
      default: ''
    },
    raw: {
      type: 'object',
      default: null
    }
  },
  getKeys: function() {
    if (!this.raw) return [];
    return _.keys(this.raw)
            .filter(function (key) { return (key[0] !== '#') && (key !== '__schema'); })
            .sort(); 
  },
  getType: function(key) {
    return (this.raw && this.raw[key] && this.raw[key]['#type']) || null;
  },
  getValues: function(key) {
    if (this.getType(key) !== 'category') {
      return [];
    }
    return _.pairs(this.raw[key]['#data'])
      .filter(function (el) { return el[0] !== '#other'; })
      .sort(function (a, b) { return b[1] - a[1]})
      .map(function (el) { return el[0] });
  }, 
  isArray: function(key) {
    return !!(this.raw && this.raw[key] && this.raw[key]['#array']);
  },
  isCategory: function(key) {
    return this.getType(key) === 'category';
  }
});
