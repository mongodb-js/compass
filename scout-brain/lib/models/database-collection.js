module.exports = require('ampersand-rest-collection').extend({
  model: require('./database'),
  comparator: '_id'
});
