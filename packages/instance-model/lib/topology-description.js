const AmpersandModel = require('ampersand-model');

const TopologyDescription = AmpersandModel.extend({
  props: {
    type: 'string',
    servers: 'array',
    setName: 'string' // TODO: not sure this actually gets used
  }
});

module.exports = TopologyDescription;