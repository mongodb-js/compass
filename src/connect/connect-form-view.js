var FormView = require('ampersand-form-view');
var InputView = require('./input-view');
var SelectView = require('ampersand-select-view');
var Connection = require('../models/connection');
var authOptions = require('./authentication');
var sslOptions = require('./ssl');
var FilteredCollection = require('ampersand-filtered-subcollection');
var debug = require('debug')('scout:connect:connect-form-view');


require('bootstrap/js/popover');
require('bootstrap/js/tooltip');

// create proxy collections that only contains the enabled auth options
var enabledAuthOptions = new FilteredCollection(authOptions, {
  where: {
    enabled: true
  }
});
var enabledSslOptions = new FilteredCollection(sslOptions, {
  where: {
    enabled: true
  }
});

var ConnectFormView = FormView.extend({
  props: {
    connection_id: {
      type: 'string'
    }
  },
  namespace: 'ConnectFormView',
  /**
   * callback when user hits submit (or presses enter). Run some general checks here
   * (connection works, etc) and set general error message at the top, or open the connection.
   *
   * @param {Object} obj     contains the clean()'ed up data from the form.
   */
  submitCallback: function(obj) {
    if (this.connection_id !== '') {
      obj._id = this.connection_id;
    }
    debug('form submitted', obj);
    this.parent.onFormSubmitted(new Connection(obj));
  },
  clean: function(obj) {
    // clean up the form values here, e.g. conversion to numbers etc.

    // fill in all default fields
    obj.hostname = obj.hostname || 'localhost';
    obj.port = parseInt(obj.port || 27017, 10);

    return obj;
  },
  /**
   * These are the default form fields that are always present in the connect dialog. Auth and
   * SSL fields are added/removed dynamically, depending on whether the options are expanded or
   * collapsed.
   *
   * @return {Array<InputView>}
   */
  fields: function() {
    return [
      // hostname field
      new InputView({
        template: require('./input-default.jade'),
        el: this.parent.queryByHook('hostname-subview'),
        name: 'hostname',
        label: 'Hostname',
        placeholder: 'localhost',
        required: false
      }),
      // port number field
      new InputView({
        template: require('./input-default.jade'),
        el: this.parent.queryByHook('port-subview'),
        name: 'port',
        label: 'Port',
        placeholder: '27017',
        required: false,
        tests: [function(value) {
          if (isNaN(value)) {
            return 'port must be a number.';
          }
        }, function(value) {
          if (parseInt(value, 10) < 0) {
            return 'port number must be positive.';
          }
        }, function(value) {
          if (parseInt(value, 10) >= 65536) {
            return 'port number must be below 65536';
          }
        }
        ]
      }),
      // authentication select dropdown
      new SelectView({
        name: 'authentication',
        label: 'Authentication',
        el: this.parent.queryByHook('authselect-subview'),
        // @see https://github.com/AmpersandJS/ampersand-select-view/issues/55
        template: require('./select-default.jade')(),
        parent: this,
        // you can pass in a collection here too
        options: enabledAuthOptions,
        // and pick an item from the collection as the selected one
        // @todo thomasr: pick the "model.selected" one (via .find() ?)
        value: enabledAuthOptions.get('MONGODB'),
        // here you specify which attribute on the objects in the collection
        // to use for the value returned.
        idAttribute: '_id',
        // you can also specify which model attribute to use as the title
        textAttribute: 'title',
        // here you can specify if it should return the selected model from the
        // collection, or just the id attribute.  defaults `true`
        yieldModel: false
      }),
      // authentication select dropdown
      new SelectView({
        name: 'ssl',
        label: 'SSL',
        el: this.parent.queryByHook('sslselect-subview'),
        // @see https://github.com/AmpersandJS/ampersand-select-view/issues/55
        template: require('./select-default.jade')(),
        parent: this,
        // you can pass in a collection here too
        options: enabledSslOptions,
        // and pick an item from the collection as the selected one
        // @todo thomasr: pick the "model.selected" one (via .find() ?)
        value: enabledSslOptions.get('NONE'),
        // here you specify which attribute on the objects in the collection
        // to use for the value returned.
        idAttribute: '_id',
        // you can also specify which model attribute to use as the title
        textAttribute: 'title',
        // here you can specify if it should return the selected model from the
        // collection, or just the id attribute.  defaults `true`
        yieldModel: false
      }),
      // connection name field
      new InputView({
        template: require('./input-default.jade'),
        el: this.parent.queryByHook('saveas-subview'),
        name: 'name',
        label: 'Name',
        placeholder: 'e.g. Shared Dev, Stats Box, PRODUCTION',
        required: false
      })
    ];
  }
});

module.exports = ConnectFormView;
