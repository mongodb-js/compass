module.exports  = require('ampersand-rest-collection').extend({
  model: require('./instance'),
  comparator: '_id'
});
