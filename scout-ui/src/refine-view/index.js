var AmpersandView = require('ampersand-view');
var debug = require('debug')('scout-ui:refine-view:index');
var $ = require('jquery');
var app = require('ampersand-app');

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
    'valid': [
      // red input border while query is invalid
      {
        type: 'booleanClass',
        hook: 'refine-input',
        yes: 'valid',
        no: 'invalid'
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
    'input [data-hook=refine-input]': 'inputChanged'
  },
  inputChanged: function(evt) {
    // validate user input on the fly
    var queryStr = $(this.queryByHook('refine-input')).val();
    try {
      JSON.parse(queryStr);
    } catch (e) {
      this.valid = false;
      return;
    }
    this.valid = true;
  },
  buttonClicked: function(evt) {
    var queryStr = $(this.queryByHook('refine-input')).val();
    // make sure it's a valid query (@todo use EJSON)
    var queryObj = JSON.parse(queryStr);
    // remove current collection view?
    // app.currentPage.switcher.current.remove();

    app.queryOptions.query = queryObj;
  }
});
