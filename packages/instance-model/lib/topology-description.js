const AmpersandModel = require('ampersand-model');

const TopologyDescription = AmpersandModel.extend({
  props: {
    type: 'string',
    servers: 'array',
    setName: 'string'
  }
});

module.exports = TopologyDescription;