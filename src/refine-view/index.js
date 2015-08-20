var AmpersandView = require('ampersand-view');
var EditableQuery = require('../models/editable-query');
var $ = require('jquery');
var EJSON = require('mongodb-extended-json');
var Query = require('mongodb-language-model').Query;
var debug = require('debug')('scout:refine-view:index');

module.exports = AmpersandView.extend({
  template: require('./index.jade'),
  session: {
    queryOptions: 'state',
    volatileQueryOptions: 'state',
    volatileQuery: 'object'
  },
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
    this.volatileQuery = this.volatileQueryOptions.query;
    this.listenToAndRun(this.volatileQueryOptions, 'change:query', this.updateQueryListener);
  },
  updateQueryListener: function() {
    this.stopListening(this.volatileQuery, 'change:buffer', this.onQueryBufferChanged);
    this.volatileQuery = this.volatileQueryOptions.query;
    this.listenTo(this.volatileQuery, 'change:buffer', this.onQueryBufferChanged);
    this.editableQuery.rawString = this.volatileQueryOptions.queryString;
  },
  onQueryBufferChanged: function() {
    this.editableQuery.rawString = EJSON.stringify(this.volatileQuery.serialize());
  },
  /**
   * when user changes the text in the input field, copy the value into editableQuery. If the
   * resulting query is valid, copy the query to volatileQueryOptions, so that the UI can update
   * itself.
   */
  inputChanged: function() {
    this.editableQuery.rawString = this.queryByHook('refine-input').value;
    if (this.editableQuery.valid) {
      this.volatileQueryOptions.query = this.editableQuery.queryObject;
    }
  },
  /**
   * When the user hits reset, restore the original query options and update the refine bar to show
   * the original query string (default is `{}`).
   */
  resetClicked: function() {
    this.queryOptions.reset();
    this.volatileQueryOptions.reset();
    this.editableQuery.rawString = this.queryOptions.queryString;
    this.trigger('submit', this);
  },
  /**
   * When the user hits refine, copy the query created from editableQuery to queryOptions (and
   * clone to volatile as well, so they are in sync). This will also trigger a resample in
   * CollectionView.
   *
   * Then copy the resulting string so that we show the correctly formatted query (with quotes).
   */
  refineClicked: function() {
    // The UI should not allow hitting refine on invalid queries, but just to be sure we
    // deny it here, too.
    if (!this.editableQuery.valid) return;
    this.volatileQueryOptions.query = this.editableQuery.queryObject;
    // clone the query
    this.queryOptions.query = new Query(this.volatileQueryOptions.query.serialize(), {
      parse: true
    });
    // update the refine bar with a valid query string
    this.editableQuery.rawString = this.queryOptions.queryString;
    this.trigger('submit', this);
  },
  /**
   * Handler for hitting enter inside the input field. First defocus, then just delegate to
   * refineClicked.
   * @param  {Object} evt    the submit event.
   */
  submit: function(evt) {
    evt.preventDefault();
    // lose focus on input field first, see http://ampersandjs.com/docs#ampersand-dom-bindings-value
    $(evt.delegateTarget).find('input').blur();
    if (this.editableQuery.valid) {
      this.refineClicked();
    }
  }
});
