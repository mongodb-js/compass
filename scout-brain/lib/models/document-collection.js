module.exports = require('ampersand-rest-collection').extend({
  model: require('./document'),
  comparator: '_id'
});
