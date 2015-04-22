module.exports = require('ampersand-rest-collection').extend({
  model: require('./deployment'),
  comparator: '_id'
});
