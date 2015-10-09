var View = require('ampersand-view');
var authFields = require('./auth-fields');
var sslFields = require('./ssl-fields');
var SidebarView = require('./sidebar');
var ConnectionCollection = require('../models/connection-collection');
var config = require('../electron/config');

var format = require('util').format;
var $ = require('jquery');
var _ = require('lodash');
var app = require('ampersand-app');
var ConnectFormView = require('./connect-form-view');
var debug = require('debug')('scout:connect:index');

require('bootstrap/js/tab');
require('bootstrap/js/popover');
require('bootstrap/js/tooltip');

/**
 * Main Connect Dialog, uses ampersand-form to render the form. By default, the authentication
 * input fields are collapsed and not active. If the user expands them, the fields are added to the
 * form and become required. If the user collapses them again, they are again removed from the form.
 *
 * The different auth mechanisms each have their own tab. The input fields for each mechanism
 * are defined in ./auth-fields.js.
 *
 */
var ConnectView = View.extend({
  template: require('./index.jade'),
  session: {
    form: 'object',
    authMethod: {
      type: 'string',
      default: null
    },
    previousAuthMethod: {
      type: 'string',
      default: null
    },
    authOpen: {
      type: 'boolean',
      default: false
    },
    sslOpen: {
      type: 'boolean',
      default: false
    },
    message: {
      type: 'string',
      default: ''
    },
    has_error: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    authLabel: {
      deps: ['authOpen'],
      fn: function() {
        return this.authOpen ? 'Disable Authentication' : 'Enable Authentication';
      }
    },
    sslLabel: {
      deps: ['sslOpen'],
      fn: function() {
        return this.sslOpen ? 'Disable SSL' : 'Enable SSL';
      }
    }
  },
  collections: {
    connections: ConnectionCollection
  },
  events: {
    'click [data-hook=openAuth]': 'onOpenAuthClicked',
    'click [data-hook=openSSL]': 'onOpenSSLClicked',
    'click [role=tab]': 'onAuthTabClicked'
  },
  bindings: {
    authOpen: [
      {
        type: 'booleanClass',
        hook: 'auth-container',
        no: 'hidden'
      },
      {
        type: 'booleanClass',
        selector: '[data-hook=openAuth] > i',
        yes: 'caret',
        no: 'caret-right'
      },
      {
        type: function(el, authOpen) {
          var width = config.windows.DEFAULT_WIDTH_DIALOG;
          var height = config.windows.DEFAULT_HEIGHT_DIALOG;
          if (authOpen) {
            // Account for extra height added by auth fields so
            // the user doesnt have to scroll.
            height += 220;
          }
          window.resizeTo(width, height);
        }
      }
    ],
    sslOpen: [
      {
        type: 'booleanClass',
        hook: 'ssl-container',
        no: 'hidden'
      },
      {
        type: 'booleanClass',
        selector: '[data-hook=openSSL] > i',
        yes: 'caret',
        no: 'caret-right'
      }
    ],
    authLabel: {
      type: 'innerHTML',
      hook: 'open-auth-label'
    },
    sslLabel: {
      type: 'innerHTML',
      hook: 'open-ssl-label'
    },
    has_error: {
      hook: 'message',
      type: 'booleanClass',
      yes: 'alert-danger'
    },
    message: [
      {
        hook: 'message',
        type: 'booleanClass',
        no: 'hidden'
      },
      {
        hook: 'message'
      }
    ]
  },
  initialize: function() {
    document.title = 'Connect to MongoDB';
    this.connections.fetch();
  },
  /**
   * Triggers when the user clicks the disclosure icon to expand/collapse
   * the auth section.
   *
   * @param {MouseEvent} evt
   */
  onOpenAuthClicked: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.toggle('authOpen');
    if (this.authOpen) {
      this.authMethod = this.previousAuthMethod || 'SCRAM-SHA-1';
    } else {
      this.authMethod = null;
    }
  },
  /**
   * Triggers when the user expands/collapses the SSL section
   *
   * @param {MouseEvent} evt - The click event
   */
  onOpenSSLClicked: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.toggle('sslOpen');

    debug('SSL is now', this.sslOpen ? 'enabled' : 'disabled');

    if (this.sslOpen) {
      // add the SSL fields to the form and redraw them when enabled
      _.each(sslFields, function(field) {
        this.form.addField(field.render());
        this.queryByHook('ssl-container').appendChild(field.el);
      }.bind(this));
    } else {
      // remove the SSL fields from the form when disabled
      _.each(sslFields, function(field) {
        this.form.removeField(field.name);
      }.bind(this));
    }
    debug('form data now has the following fields', Object.keys(this.form.data));
  },

  /**
   * Triggers when the user switches between auth tabs
   * @param  {MouseEvent} evt - the click event
   */
  onAuthTabClicked: function(evt) {
    this.authMethod = $(evt.target).data('method');
  },
  createNewConnection: function() {
    debug('new connection requested');
    this.reset();
    this.form.connection_id = '';
    this.form.reset();
    this.authMethod = null;
    this.authOpen = false;
  },
  onConnectionDestroyed: function() {
    this.reset();
    this.form.connection_id = '';
    this.form.reset();
    this.authMethod = null;
    this.authOpen = false;
  },

  /**
   * Triggers when the auth methods has changed (or set back to null)
   */
  onAuthMethodChange: function() {
    debug('auth method has changed from', this.previousAuthMethod, 'to', this.authMethod);

    // remove and unregister old fields
    var oldFields = authFields[this.previousAuthMethod];
    debug('removing fields:', _.pluck(oldFields, 'name'));
    _.each(oldFields, function(field) {
      this.form.removeField(field.name);
    }.bind(this));

    // register new with form, render, append to DOM
    var newFields = authFields[this.authMethod];
    debug('adding fields:', _.pluck(newFields, 'name'));

    _.each(newFields, function(field) {
      this.form.addField(field.render());
      this.query('#' + this.authMethod).appendChild(field.el);
    }.bind(this));

    this.previousAuthMethod = this.authMethod;
    debug('form data now has the following fields', Object.keys(this.form.data));
  },
  /**
   * Use a connection to view schemas, such as after
   * submitting a form or when double-clicking on
   * a list item like in `./sidebar`.
   *
   * @param {Connection} model
   * @api public
   */
  connect: function(model) {
    app.statusbar.show();

    debug('testing credentials are usable...');
    model.test(function(err) {
      app.statusbar.hide();
      if (!err) {
        this.onConnectionSuccessful(model);
        return;
      }

      debug('failed to connect', err);

      this.onError(new Error('Could not connect to MongoDB.'), model);
      return;
    }.bind(this));
  },
  /**
   * If the connection is useable, save/update it in the
   * store and open a new window that will show the schema
   * view using it.
   *
   * @param {Connection} model
   * @api private
   */
  onConnectionSuccessful: function(model) {
    app.statusbar.hide();
    this.form.connection_id = '';

    /**
     * The save method will handle calling the correct method
     * of the sync being used by the model, whether that's
     * `create` or `update`.
     *
     * @see http://ampersandjs.com/docs#ampersand-model-save
     */
    model.last_used = new Date();
    model.save();
    /**
     * @todo (imlucas): So we can see what auth mechanisms
     * and accoutrement people are actually using IRL.
     *
     *   metrics.trackEvent('connect success', {
     *     auth_mechanism: model.auth_mechanism,
     *     ssl: model.ssl
     *   });
     */
    this.connections.add(model, {
      merge: true
    });

    debug('opening schema view for', model.serialize());
    window.open(format('%s?connection_id=%s#schema', window.location.origin, model.getId()));
    setTimeout(this.set.bind(this, {
      message: ''
    }), 500);

    setTimeout(window.close, 1000);
  },
  /**
   * If there is a validation or connection error show a nice message.
   *
   * @param {Error} err
   * @param {Connection} model
   * @api private
   */
  onError: function(err, model) {
    // @todo (imlucas): `metrics.trackEvent('connect error', auth_mechanism + ssl boolean)`
    debug('showing error message', {
      err: err,
      model: model
    });
    this.message = err.message;
    this.has_error = true;
  },
  /**
   * When the form is submitted, validate the resulting model
   * and then connect using it.
   *
   * @param {Connection} model
   * @api private
   */
  onFormSubmitted: function(model) {
    this.reset();

    if (_.trim(model.name) === '') {
      // If no name specified, the connection name
      // will be `Untitled (1)`.  If there are existing
      // `Untitled (\d)` connections, increment a counter
      // on them like every MS Office does.
      var untitleds = _.chain(this.connections.models)
        .filter(function(model) {
          return _.startsWith(model.name, 'Untitled (');
        })
        .sort('name')
        .value();

      model.name = format('Untitled (%d)', untitleds.length + 1);
    }

    // @todo (imlucas): Dont allow duplicate names?

    if (!model.isValid()) {
      this.onError(model.validationError);
      return;
    }

    this.connect(model);
  },
  /**
   * Update the form's state based on an existing
   * connection, e.g. clicking on a list item
   * like in `./sidebar.js`.
   *
   * @param {Connection} model
   * @api public
   */
  onConnectionSelected: function(model) {
    // If the new model has auth, expand the auth settings container
    // and select the correct tab.
    // @note (imlucas): gross, but `this.authMethod` is only used
    // for managing auth-fields.js so make this pretty when
    // there's more time.
    if (model.auth_mechanism === 'MONGODB-CR') {
      this.authMethod = 'SCRAM-SHA-1';
    } else {
      this.authMethod = model.auth_mechanism;
    }

    if (model.auth_mechanism !== null) {
      this.authOpen = true;
    } else {
      this.authOpen = false;
    }

    // Changing `this.authMethod` dynamically updates the
    // fields in the form because it's a top-level constraint
    // so we need to get a list of what keys are currently
    // available to set.
    var keys = ['name', 'port', 'hostname'];
    if (model.auth_mechanism) {
      keys.push.apply(keys, _.pluck(authFields[this.authMethod], 'name'));
    }

    debug('Populating form fields with keys', keys);
    var values = _.pick(model, keys);

    this.form.connection_id = model.getId();

    // Populates the form from values in the model.
    this.form.setValues(values);
  },
  render: function() {
    // @todo (imlucas): Consolidate w/ `./auth-fields.js`.
    var authMethods = [
      {
        _id: 'SCRAM-SHA-1',
        title: 'User/Password',
        enabled: true
      },
      {
        _id: 'GSSAPI',
        title: 'Kerberos',
        enabled: app.isFeatureEnabled('Connect with Kerberos')
      },
      {
        _id: 'PLAIN',
        title: 'LDAP',
        enabled: app.isFeatureEnabled('Connect with LDAP')
      },
      {
        _id: 'MONGODB-X509',
        title: 'X.509',
        enabled: app.isFeatureEnabled('Connect with X.509')
      }
    ];
    this.renderWithTemplate({
      authMethods: authMethods,
      getFeatureClass: function getFeatureClass(feature_id) {
        if (!app.isFeatureEnabled(feature_id)) {
          return ['hidden'];
        }
      }
    });

    this.form = new ConnectFormView({
      parent: this,
      el: this.queryByHook('connect-form'),
      autoRender: true,
      autoAppend: false
    });

    this.registerSubview(this.form);
    this.listenToAndRun(this, 'change:authMethod', this.onAuthMethodChange.bind(this));

    // enable popovers
    $(this.query('[data-toggle="popover"]'))
      .popover({
        container: 'body',
        placement: 'top',
        trigger: 'hover'
      });
  },
  /**
   * Return to a clean state between form submissions.
   *
   * @api private
   */
  reset: function() {
    this.message = '';
    this.has_error = false;
  },
  subviews: {
    sidebar: {
      waitFor: 'connections',
      hook: 'sidebar-subview',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          collection: this.connections
        });
      }
    }
  }
});

module.exports = ConnectView;
