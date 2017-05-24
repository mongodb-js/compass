/**
 * ### ssl
 *
 * @see https://github.com/mongodb-js/mongodb-connection-model#trait-ssl
 */
var SSLOptionCollection = require('./models/ssl-option-collection');

var inputTemplate = require('./input-default.jade');

var InputView = require('./input-view');
var FileReaderView = require('./filereader-view');

// var debug = require('debug')('mongodb-compass:connect:ssl');

var NONE = {
  _id: 'NONE',
  title: 'Off',
  description: 'Do not use SSL for anything',
  enabled: true
};

var UNVALIDATED = {
  _id: 'UNVALIDATED',
  title: 'Unvalidated (insecure)',
  description: 'Use SSL but do not perform any validation of'
    + ' the certificate chain... which is basically pointless.',
  // @todo (imlucas) Fix `app.isFeatureEnabled` is not a function.
  // enabled: app.isFeatureEnabled('Connect with SSL UNVALIDATED')
  enabled: true
};

var SYSTEMCA = {
  _id: 'SYSTEMCA',
  title: 'Use System CA / Atlas Deployment',
  description: 'Use SSL and use the System CA for Server validation.'
    + 'This works for Atlas Deployments as well.',
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
    new FileReaderView({
      name: 'ssl_ca',
      multi: true,
      label: 'Certificate Authority',
      helpEntry: 'https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities',
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
    new FileReaderView({
      name: 'ssl_ca',
      multi: true,
      label: 'Certificate Authority',
      helpEntry: 'https://docs.mongodb.com/manual/tutorial/configure-ssl/#certificate-authorities',
      required: true
    }),
    new FileReaderView({
      name: 'ssl_certificate',
      label: 'Client Certificate',
      helpEntry: 'https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file',
      required: true
    }),
    new FileReaderView({
      name: 'ssl_private_key',
      label: 'Client Private Key',
      helpEntry: 'https://docs.mongodb.com/manual/tutorial/configure-ssl/#pem-file',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssl_private_key_password',
      label: 'Client Key Password',
      helpEntry: 'https://docs.mongodb.com/manual/reference/configuration-options/#net.ssl.PEMKeyPassword',
      required: false
    })
  ]
};

module.exports = new SSLOptionCollection([
  NONE,
  SYSTEMCA,
  SERVER,
  ALL,
  UNVALIDATED
]);
