const { EventEmitter, once } = require('events');

const { MongoClient } = require('mongodb');
const { default: SSHTunnel } = require('@mongodb-js/ssh-tunnel');

const Connection = require('./extended-model');

const {
  redactSshTunnelOptions,
  redactConnectionString
} = require('./redact');

const debug = require('debug')('mongodb-connection-model:connect');

async function createAndConnectTunnel(model) {
  if (!model.sshTunnel ||
    model.sshTunnel === 'NONE' ||
    !model.sshTunnelOptions) {
    return null;
  }

  debug('creating ssh tunnel with options',
    model.sshTunnel,
    redactSshTunnelOptions(model.sshTunnelOptions)
  );

  const tunnel = new SSHTunnel(model.sshTunnelOptions);

  debug('connecting ssh tunnel');
  await tunnel.listen();
  debug('ssh tunnel connected');

  return tunnel;
}

async function forceCloseTunnel(tunnelToClose) {
  if (tunnelToClose) {
    try {
      await tunnelToClose.close();
      debug('ssh tunnel stopped');
    } catch (err) {
      debug('ssh tunnel stopped with error: %s', err.message);
    }
  }
}

async function waitForTunnelError(tunnel) {
  const [error] = await once(tunnel || new EventEmitter(), 'error');
  throw error;
}

async function connect(model, setupListeners) {
  if (model.serialize === undefined) {
    // note this is only here for testing reasons and would not be
    // necessary otherwise: in many tests the model is a plain object
    // and that would lack some of the getters used by this function.
    model = new Connection(model);
  }

  debug('connecting ...');

  const url = model.driverUrlWithSsh;
  const options = {
    ...model.driverOptions
  };

  // if `auth` is passed then username and password must be present,
  // we remove this here as a safe-guard to make sure we don't get
  // an empty object that would break the connection.
  //
  // We could remove this line if we refactor connection model and we
  // have better control on what we get from it.
  //
  // NOTE: please redact the options in the debug output of this file
  // if we start to use `options.auth`.
  delete options.auth;

  /** @type {SSHTunnel} */
  const tunnel = await createAndConnectTunnel(model);

  debug(
    'creating MongoClient',
    {
      url: redactConnectionString(url),
      options
    }
  );

  const mongoClient = new MongoClient(url, options);

  if (setupListeners) {
    setupListeners(mongoClient);
  }

  try {
    debug('waiting for MongoClient to connect ...');
    const client = await Promise.race([
      mongoClient.connect(),
      waitForTunnelError(tunnel)
    ]);

    return {
      client,
      tunnel,
      connectionOptions: { url, options }
    };
  } catch (err) {
    debug('connection error', err);
    debug('force shutting down ssh tunnel ...');
    await forceCloseTunnel(tunnel);
    throw err;
  }
}

module.exports = (model, setupListeners, done) => connect(model, setupListeners)
  .then(
    (res) => process.nextTick(() => done(null, ...res)),
    (err) => process.nextTick(() => done(err))
  );
