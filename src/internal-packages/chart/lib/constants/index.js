const aggregations = require('./aggregations');
const channels = require('./channels');
const reductions = require('./reductions');
const spec = require('./spec');
const types = require('./types');

module.exports = Object.freeze(Object.assign({},
  aggregations, channels, reductions, spec, types));
