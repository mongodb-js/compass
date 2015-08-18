var AmpersandView = require('ampersand-view');
var EJSON = require('mongodb-extended-json');
var EditableQuery = require('../models/editable-query');
var _ = require('lodash');
var $ = require('jquery');
var Query = require('mongodb-language-model').Query;
var debug = require('debug')('scout:refine-view:index');

module.exports = AmpersandView.extend({
  template: require('./index.jade'),
  derived: {
    notEmpty: {
      deps: ['editableQuery.queryString'],
      fn: function() {
        return this.editableQuery.queryString !== '{}';
      }
    }
  },
  children: {
    editableQuery: EditableQuery
  },
  bindings: {
    'editableQuery.rawString': {
      type: 'value',
      hook: 'refine-input'
    },
    // @todo, rethink these
    notEmpty: [{
      type: 'toggle',
      hook: 'reset-button'
    }, {
      type: 'booleanClass',
      hook: 'refine-button',
      yes: 'btn-info',
      no: 'btn-default'
    }],
    'editableQuery.valid': [
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
    'click [data-hook=refine-button]': 'refineClicked',
    'click [data-hook=reset-button]': 'resetClicked',
    'input [data-hook=refine-input]': 'inputChanged',
    'submit form': 'submit'
  },
  initialize: function() {
    this.listenTo(this.model, 'change:queryString', this.onQueryChanged);
  },
  onQueryChanged: function() {
    this.editableQuery.rawString = this.model.queryString;
  },
  inputChanged: function() {
    this.editableQuery.rawString = this.queryByHook('refine-input').value;
  },
  resetClicked: function() {
    this.model.query = new Query();
    this.editableQuery.rawString = this.model.queryString;
    this.trigger('submit', this);
  },
  refineClicked: function() {
    var queryObj = new Query(EJSON.parse(this.editableQuery.cleanString), {
      parse: true
    });
    this.model.query = queryObj;
    this.editableQuery.rawString = this.model.queryString;
    this.trigger('submit', this);
  },
  submit: function(evt) {
    evt.preventDefault();
    // lose focus on input field first, see http://ampersandjs.com/docs#ampersand-dom-bindings-value
    $(evt.delegateTarget).find('input').blur();
    if (this.editableQuery.valid) {
      this.refineClicked();
    }
  }
});
