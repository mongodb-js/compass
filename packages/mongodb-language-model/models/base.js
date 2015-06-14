var AmpersandState = require('ampersand-state');

/**
 * Base is the base class for all other models
 * @type {AmpersandState}
 *
 * @property {boolean} valid  describes if the query portion of this model is valid 
 * @property {any} buffer     contains the query portion that this context covers. read-only.
 * @property {object} schema  the schema for the entire hierarchy of models. usually passed
 *                            down from parent context to child model.
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
    },
    schema: {
      type: 'object',
      default: null
    }
  },
  session: {
    className: {         // mainly for debug purposes
      type: 'string',
      default: 'Base'   
    }
  },
  bufferChanged: function() {
    this.trigger('change:buffer');
  }
});
