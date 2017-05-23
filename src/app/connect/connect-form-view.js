var FormView = require('ampersand-form-view');
var InputView = require('./input-view');
var SelectView = require('ampersand-select-view');
var authOptions = require('./authentication');
var sslOptions = require('./ssl');
var sshTunnelOptions = require('./ssh-tunnel');
var readPreferenceOptions = require('./read-preference');
var FilteredCollection = require('ampersand-filtered-subcollection');
// var debug = require('debug')('mongodb-compass:connect:connect-form-view');

var inputTemplate = require('./input-default.jade');
var selectTemplate = require('./select-default.jade');

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

var enabledSshTunnelOptions = new FilteredCollection(sshTunnelOptions, {
  where: {
    enabled: true
  }
});

/**
 * special input view that validates against a list of conflicting values, which can be
 * set (and changed) externally.
 */
var ConflictingValuesInputView = InputView.extend({
  props: {
    conflicting: {
      type: 'array',
      default: function() {
        return [];
      }
    }
  },
  tests: [function(value) {
    if (this.conflicting.indexOf(value) !== -1) {
      return 'This name already exists. Please choose another name.';
    }
  }
  ]
});


var ConnectFormView = FormView.extend({
  namespace: 'ConnectFormView',
  /**
   * callback when user hits submit (or presses enter). Run some general checks here
   * (connection works, etc) and set general error message at the top, or open the connection.
   *
   * @param {Object} obj     contains the clean()'ed up data from the form.
   */
  submitCallback: function() {
    this.parent.submitForm();
  },
  clean: function(obj) {
    // clean up the form values here, e.g. conversion to numbers etc.

    // fill in all default fields
    obj.hostname = obj.hostname.toLowerCase() || 'localhost';
    obj.port = parseInt(obj.port || 27017, 10);
    obj.ssh_tunnel_port = parseInt(obj.ssh_tunnel_port || 22, 10);

    // make a friendly connection name
    // this.makeFriendlyName(obj);

    return obj;
  },
  events: {
    'blur [name="hostname"]': 'blurHostname'
  },
  blurHostname: function(e) {
    if (e.target.value.match(/mongodb.net$/i)) {
      this.setValue('ssl', 'SYSTEMCA');
    }
  },
  /**
   * These are the default form fields that are always present in the connect dialog. Auth and
   * SSL fields are added/removed dynamically, depending on whether the options are expanded or
   * collapsed.
   *
   * @return {Array<InputView>}
   */
  fields: function() {
    window.jQuery = require('jquery');
    require('bootstrap/js/tooltip');
    require('bootstrap/js/popover');

    return [
      // hostname field
      new InputView({
        template: inputTemplate,
        el: this.parent.queryByHook('hostname-subview'),
        name: 'hostname',
        label: 'Hostname',
        placeholder: 'localhost',
        required: false
      }),
      // port number field
      new InputView({
        template: inputTemplate,
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
        template: selectTemplate(),
        parent: this,
        // you can pass in a collection here too
        options: enabledAuthOptions,
        // and pick an item from the collection as the selected one
        value: enabledAuthOptions.get('NONE'),
        // here you specify which attribute on the objects in the collection
        // to use for the value returned.
        idAttribute: '_id',
        // you can also specify which model attribute to use as the title
        textAttribute: 'title',
        // here you can specify if it should return the selected model from the
        // collection, or just the id attribute.  defaults `true`
        yieldModel: false
      }),
      new InputView({
        template: inputTemplate,
        el: this.parent.queryByHook('replica-set-name-subview'),
        name: 'replica-set-name',
        label: 'Replica Set Name',
        required: false
      }),
      new SelectView({
        name: 'read-preference',
        label: 'Read Preference',
        el: this.parent.queryByHook('read-preference-subview'),
        // @see https://github.com/AmpersandJS/ampersand-select-view/issues/55
        template: selectTemplate(),
        parent: this,
        // you can pass in a collection here too
        options: readPreferenceOptions,
        // and pick an item from the collection as the selected one
        value: readPreferenceOptions.get('primary'),
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
        template: selectTemplate(),
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
      // SSH Tunnel select subview.
      new SelectView({
        name: 'ssh_tunnel',
        label: 'SSH Tunnel',
        el: this.parent.queryByHook('ssh_tunnel-select-subview'),
        template: selectTemplate(),
        parent: this,
        options: enabledSshTunnelOptions,
        value: enabledSshTunnelOptions.get('NONE'),
        idAttribute: '_id',
        textAttribute: 'title',
        yieldModel: false
      }),
      // connection name field
      new ConflictingValuesInputView({
        template: inputTemplate,
        el: this.parent.queryByHook('saveas-subview'),
        name: 'name',
        label: 'Favorite Name',
        placeholder: 'e.g. Shared Dev, QA Box, PRODUCTION',
        helpEntry: 'https://docs.mongodb.com/compass/current/connect/',
        required: false
      })
    ];
  }
});

module.exports = ConnectFormView;
