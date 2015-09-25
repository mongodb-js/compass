var app = require('ampersand-app');
var FormView = require('ampersand-form-view');
var InputView = require('./input-view');
var Connection = require('../models/connection');
var debug = require('debug')('scout:connect:connect-form-view');

require('bootstrap/js/tab');
require('bootstrap/js/popover');
require('bootstrap/js/tooltip');

var ConnectFormView = FormView.extend({
  namespace: 'ConnectFormView',
  /**
   * callback when user hits submit (or presses enter). Run some general checks here
   * (connection works, etc) and set general error message at the top, or open the connection.
   *
   * @param {Object} obj     contains the clean()'ed up data from the form.
   */
  submitCallback: function(obj) {
    debug('form submitted', obj);
    this.parent.onFormSubmitted(new Connection(obj));
  },
  clean: function(obj) {
    // clean up the form values here, e.g. conversion to numbers etc.

    // get auth mechanism from parent view
    obj.auth_mechanism = this.parent.authMethod;

    // is SSL enabled (options are open)
    obj.ssl = this.parent.sslOpen;

    // fill in all default fields
    obj.hostname = obj.hostname || 'localhost';
    obj.port = obj.port || 27017;

    // port number must be numeric
    obj.port = Number(obj.port);

    if (obj.auth_mechanism) {
      // default fields for auth
      obj.database_name = obj.database_name || 'admin';
    }

    return obj;
  },
  /**
   * These are the default form fields that are always present in the connect dialog. Auth and
   * SSL fields are added/removed dynamically, depending on whether the options are expanded or
   * collapsed.
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
            debug('checking for number');
            return 'port must be a number.';
          }
        }, function(value) {
          if (parseInt(value, 10) < 0) {
            return 'port number must be positive.';
          }
        }
        ]
      }),
      // connection name field
      new InputView({
        template: require('./input-saveas.jade'),
        el: this.parent.queryByHook('saveas-subview'),
        name: 'name',
        placeholder: 'e.g. Shared Dev, Stats Box, PRODUCTION',
        required: false
      })
    ];
  }
});

module.exports = ConnectFormView;
