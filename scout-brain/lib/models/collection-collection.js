module.exports = require('ampersand-rest-collection').extend(require('ampersand-collection-filterable'), {
  model: require('./collection'),
  comparator: '_id'
});
