/**
 * ### ssl
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-ssl
 */
var app = require('ampersand-app');
var SSLOptionCollection = require('./models/ssl-option-collection');

var InputView = require('./input-view');
var inputTemplate = require('./input-default.jade');
var fileReaderTemplate = require('./filereader-default.jade');

var debug = require('debug')('scout:connect:ssl');

var NONE = {
  _id: 'NONE',
  title: 'Off',
  description: 'Do not use SSL for anything',
  enabled: true
};

var UNVALIDATED = {
  _id: 'UNVALIDATED',
  title: 'Unvalidated',
  description: 'Use SSL but do not perform any validation of'
    + ' the certificate chain... which is basically pointless.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL UNVALIDATED')
  enabled: true
};

var SERVER = {
  _id: 'SERVER',
  title: 'Server Validation',
  description: 'The driver should validate the server certificate and'
    + ' fail to connect if validation fails.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL SERVER'),
  enabled: true,
  fields: [
    // new InputView({
    //   template: inputTemplate,
    //   name: 'ssl_ca',
    //   label: 'SSL CA file',
    //   placeholder: '',
    //   required: true
    // }),
    new InputView({
      template: fileReaderTemplate,
      name: 'ssl_ca',
      type: 'file',
      label: 'Certificate Authority file',
      placeholder: '',
      required: true
    })
  ]
};

var ALL = {
  _id: 'ALL',
  title: 'Server and Client Validation',
  description: 'The driver must present a valid certificate'
    + ' and validate the server certificate.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL ALL'),
  enabled: true,
  fields: [
    new InputView({
      template: fileReaderTemplate,
      name: 'ssl_ca',
      type: 'file',
      label: 'Certificate Authority file',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: fileReaderTemplate,
      name: 'ssl_private_key',
      type: 'file',
      label: 'Certificate Key file',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: fileReaderTemplate,
      name: 'ssl_certificate',
      type: 'file',
      label: 'Certificate file',
      placeholder: '',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssl_private_key_password',
      type: 'password',
      label: 'Private Key Password',
      placeholder: '',
      required: false
    })
  ]
};

module.exports = new SSLOptionCollection([
  NONE,
  UNVALIDATED,
  SERVER,
  ALL
]);
