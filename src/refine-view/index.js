var AmpersandView = require('ampersand-view');
var EJSON = require('mongodb-extended-json');

module.exports = AmpersandView.extend({
  template: require('./index.jade'),
  props: {
    valid: {
      type: 'boolean',
      default: true
    }
  },
  bindings: {
    'model.queryString': {
      type: 'value',
      hook: 'refine-input'
    },
    valid: [
      // red input border while query is invalid
      {
        type: 'booleanClass',
        hook: 'refine-input-group',
        yes: '',
        no: 'has-error'
      },
      // disable button while query is invalid
      {
        type: 'booleanAttribute',
        hook: 'refine-button',
        no: 'disabled',
        yes: null
      }
    ]
  },
  events: {
    'click [data-hook=refine-button]': 'buttonClicked',
    'input [data-hook=refine-input]': 'inputChanged',
    'submit form': 'submit'
  },
  inputChanged: function() {
    // validate user input on the fly
    var queryStr = this.queryByHook('refine-input').value;
    try {
      EJSON.parse(queryStr);
    } catch (e) {
      this.valid = false;
      return;
    }
    this.valid = true;
  },
  buttonClicked: function() {
    var queryStr = this.queryByHook('refine-input').value;
    var queryObj = EJSON.parse(queryStr);
    this.model.query = queryObj;

    // Modifying the query will reset field-list#schema and because we're using
    // good ampersand, outgoing views will be removed for us automatically.
  },
  submit: function(evt) {
    evt.preventDefault();
    this.buttonClicked();
  }
});
