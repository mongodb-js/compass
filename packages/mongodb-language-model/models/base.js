var AmpersandState = require('ampersand-state');

/**
 * Base is the base class for all other models
 * @type {AmpersandState}
 *
 * @property {boolean} valid  describes if the query portion of this model is valid.
 * @property {any} buffer     contains the query portion that this model covers.
 */
var Base = module.exports = AmpersandState.extend({
  extraProperties: 'reject',
  props: {
    valid: {
      type: 'boolean',
      default: false
    },
    buffer: {
      type: 'any',
      default: null
    }
  },
  session: {
    // mainly for debug purposes
    className: {
      type: 'string',
      default: 'Base'
    }
  },
  bufferChanged: function() {
    this.trigger('change:buffer');
  }
});
