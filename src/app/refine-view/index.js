var $ = require('jquery');
var _ = require('lodash');
var AmpersandView = require('ampersand-view');
var EditableQuery = require('../models/editable-query');
var EJSON = require('mongodb-extended-json');
var Query = require('mongodb-language-model').Query;
var QueryOptions = require('../models/query-options');
var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();

// var metrics = require('mongodb-js-metrics')();
// var debug = require('debug')('scout:refine-view:index');

var indexTemplate = require('./index.jade');

var DEFAULT_QUERY = JSON.stringify(QueryOptions.DEFAULT_QUERY);

module.exports = AmpersandView.extend({
  template: indexTemplate,
  props: {
    visible: {
      type: 'boolean',
      default: true
    }
  },
  session: {
    queryOptions: 'state',
    volatileQueryOptions: 'state',
    volatileQuery: 'object'
  },
  derived: {
    notEmpty: {
      deps: ['editableQuery.rawString'],
      fn: function() {
        return this.editableQuery.rawString !== DEFAULT_QUERY;
      }
    },
    hasChanges: {
      deps: ['editableQuery.cleanString', 'queryOptions.queryString'],
      fn: function() {
        return this.editableQuery.cleanString !== this.queryOptions.queryString;
      }
    },
    applyEnabled: {
      deps: ['editableQuery.valid', 'hasChanges'],
      fn: function() {
        return this.editableQuery.valid && this.hasChanges;
      }
    }
  },
  children: {
    editableQuery: EditableQuery
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    },
    'editableQuery.rawString': [
      {
        type: 'value',
        hook: 'refine-input'
      },
      {
        hook: 'apply-btn',
        type: function(el) {
          this.highlightApplyBtnIfQueryNotApplied(el);
        }
      }
    ],
    // red input border while query is invalid
    'editableQuery.valid': {
      type: 'booleanClass',
      hook: 'refine-input-group',
      yes: '',
      no: 'has-error'
    },
    notEmpty: {
      type: 'toggle',
      hook: 'reset-button'
    },
    applyEnabled: {
      type: 'booleanAttribute',
      no: 'disabled',
      hook: 'apply-btn'
    }
  },
  events: {
    'click [data-hook=apply-btn]': 'applyClicked',
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
    var view = this;
    view.editableQuery.rawString = view.queryByHook('refine-input').value;
    if (view.editableQuery.valid) {
      view.volatileQueryOptions.query = view.editableQuery.queryObject;
    }
    // re-focus the input field after the minicharts have updated
    _.defer(function() {
      $(view.queryByHook('refine-input')).focus();
    });
  },
  /**
   * When the user hits reset, restore the original query options and update the refine bar to show
   * the original query string (default is `{}`).
   */
  resetClicked: function() {
    if (this.queryOptions.queryString !== DEFAULT_QUERY) {
      this.queryOptions.reset();
      this.volatileQueryOptions.reset();
      this.trigger('submit', this);
    } else {
      // currently still showing the view of default query `{}`, no need to resample
      this.editableQuery.rawString = DEFAULT_QUERY;
      this.volatileQueryOptions.query = this.editableQuery.queryObject;
    }
  },
  /**
   * When the user hits refine, copy the query created from editableQuery to queryOptions (and
   * clone to volatile as well, so they are in sync). This will also trigger a resample in
   * CollectionView.
   *
   * Then copy the resulting string so that we show the correctly formatted query (with quotes).
   */
  applyClicked: function() {
    // The UI should not allow hitting refine on invalid queries, but just to be sure we
    // deny it here, too.
    if (!this.editableQuery.valid) {
      return;
    }
    this.volatileQueryOptions.query = this.editableQuery.queryObject;
    // clone the query
    this.queryOptions.query = new Query(this.volatileQueryOptions.query.serialize(), {
      parse: true
    });
    // update the refine bar with a valid query string
    this.editableQuery.rawString = this.queryOptions.queryString;
    this.trigger('submit', this);

    this.unhighlightBtn($('[data-hook=\'apply-btn\']')[0]);
  },
  /**
   * Handler for hitting enter inside the input field. First defocus, then just delegate to
   * applyClicked.
   * @param  {Object} evt    the submit event.
   */
  submit: function(evt) {
    evt.preventDefault();
    // lose focus on input field first, see http://ampersandjs.com/docs#ampersand-dom-bindings-value
    $(evt.delegateTarget).find('input').blur();
    if (this.editableQuery.valid) {
      this.applyClicked();
    }
  },
  highlightApplyBtnIfQueryNotApplied: function(applyBtn) {
    if (!_.isUndefined(applyBtn)) {
      if (this.editableQuery.valid && this.editableQuery.rawString !== this.queryOptions.queryString) {
        this.highlightBtn(applyBtn);
      } else {
        this.unhighlightBtn(applyBtn);
      }
    }
  },
  highlightBtn: function(btn) {
    btn.classList.remove('btn-default');
    btn.classList.add('btn-info');
  },
  unhighlightBtn: function(btn) {
    btn.classList.remove('btn-info');
    btn.classList.add('btn-default');
  }
});
