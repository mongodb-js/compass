/**
 * Allow HTTP bodies to use extended-json so types are not a pain.
 */
var EJSON = require('mongodb-extended-json');

module.exports = require('body-parser').json({
  reviver: EJSON.reviver
});
