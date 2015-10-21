/**
 * ### ssl
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-ssl
 */
var app = require('ampersand-app');
var SSLOptionCollection = require('./models/ssl-option-collection');

var InputView = require('./input-view');
var FileReaderInputView = require('ampersand-filereader-input-view');
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
    //   label: 'Path to SSL CA file',
    //   placeholder: '',
    //   required: true
    // }),
    new FileReaderInputView({
      name: 'ssl_ca',
      template: fileReaderTemplate,
      callback: function(fileInputView, data) {
        debug('file selected callback', fileInputView, data);
      },
      label: 'Path to Certificate Authority file',
      placeholder: '',
      type: 'file'
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
    new FileReaderInputView({
      name: 'ssl_ca',
      template: fileReaderTemplate,
      callback: function(fileInputView, data) {
        debug('file selected callback', fileInputView, data);
      },
      label: 'Path to Certificate Authority file',
      placeholder: '',
      type: 'file'
    }),
    new FileReaderInputView({
      name: 'ssl_private_key',
      template: fileReaderTemplate,
      callback: function(fileInputView, data) {
        debug('file selected callback', fileInputView, data);
      },
      label: 'Path to Private Key file',
      placeholder: '',
      type: 'file'
    }),
    new FileReaderInputView({
      name: 'ssl_certificate',
      template: fileReaderTemplate,
      callback: function(fileInputView, data) {
        debug('file selected callback', fileInputView, data);
      },
      label: 'Path to Certificate file',
      placeholder: '',
      type: 'file'
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
