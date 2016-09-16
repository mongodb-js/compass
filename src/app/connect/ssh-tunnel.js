var SSHTunnelOptionCollection = require('./models/ssh-tunnel-option-collection');
var inputTemplate = require('./input-default.jade');
var InputView = require('./input-view');
var FileReaderView = require('./filereader-view');

/**
 * Not using a SSH tunnel.
 */
var NONE = {
  _id: 'NONE',
  title: 'Off',
  description: 'Do not use SSH Tunnel',
  enabled: true
};

/**
 * Using a SSH tunnel that authenticates only with user and password.
 */
var USER_PASSWORD = {
  _id: 'USER_PASSWORD',
  title: 'Use Password',
  description: 'Connect using a username and password.',
  enabled: true,
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_hostname',
      label: 'SSH Hostname',
      helpEntry: 'ssh-tunnel-hostname',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_port',
      label: 'SSH Tunnel Port',
      placeholder: '22',
      helpEntry: 'ssh-tunnel-port',
      required: false,
      tests: [
        function(value) {
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
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_username',
      label: 'SSH Username',
      helpEntry: 'ssh-tunnel-username',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_password',
      label: 'SSH Password',
      helpEntry: 'ssh-tunnel-password',
      required: true,
      type: 'password'
    })
  ]
};

/**
 * Using a SSH tunnel that authenticates with an identity file.
 */
var IDENTITY_FILE = {
  _id: 'IDENTITY_FILE',
  title: 'Use Identity File',
  description: 'Connect using an identity file and optional password',
  enabled: true,
  fields: [
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_hostname',
      label: 'SSH Hostname',
      helpEntry: 'ssh-tunnel-hostname',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_port',
      label: 'SSH Tunnel Port',
      placeholder: '22',
      helpEntry: 'ssh-tunnel-port',
      required: false
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_username',
      label: 'SSH Username',
      helpEntry: 'ssh-tunnel-username',
      required: true
    }),
    new FileReaderView({
      name: 'ssh_tunnel_identity_file',
      label: 'SSH Identity File',
      helpEntry: 'ssh-tunnel-identity-file',
      required: true
    }),
    new InputView({
      template: inputTemplate,
      name: 'ssh_tunnel_passphrase',
      label: 'Passphrase',
      helpEntry: 'ssh-tunnel-passphrase',
      required: false,
      type: 'password'
    })
  ]
};

module.exports = new SSHTunnelOptionCollection([
  NONE,
  USER_PASSWORD,
  IDENTITY_FILE
]);
