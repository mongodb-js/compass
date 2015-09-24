var InputView = require('./input-view');

/**
 * Define the input fields for SSL here.
 *
 * @todo These are placeholder objects and will likely change according to what exactly we
 * need for an SSL connection.
 */


/**
 * Input field for ssl_ca
 */
var ssl_ca = new InputView({
  template: require('./input-default.jade'),
  name: 'ssl_ca',
  label: 'SSL CA',
  placeholder: '',
  required: true
});

/**
 * Input field for ssl_cert
 */
var ssl_cert = new InputView({
  template: require('./input-default.jade'),
  name: 'ssl_cert',
  label: 'SSL Certificate',
  placeholder: '',
  required: true
});

/**
 * Input field ssl_private_key
 */
var ssl_private_key = new InputView({
  template: require('./input-default.jade'),
  name: 'ssl_private_key',
  label: 'SSL Private Key',
  placeholder: '',
  required: true
});

/**
 * Input field for private key password. Uses type='password' to hide input.
 */
var ssl_private_key_password = new InputView({
  template: require('./input-default.jade'),
  type: 'password',
  name: 'ssl_private_key_password',
  label: 'SSL Private Key Password',
  placeholder: '',
  required: true
});


module.exports = [
  ssl_ca,
  ssl_cert,
  ssl_private_key,
  ssl_private_key_password
];
