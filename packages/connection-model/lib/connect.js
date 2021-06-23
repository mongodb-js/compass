const util = require('util');
const { EventEmitter, once } = require('events');

const { MongoClient } = require('mongodb');
const { default: SSHTunnel } = require('@mongodb-js/ssh-tunnel');

const debug = require('debug')('mongodb-connection-model:connect');

function redactCredentials(uri) {
  const regexes = [
    // Username and password
    /(?<=\/\/)(.*)(?=\@)/g,
    // AWS IAM Session Token as part of query parameter
    /(?<=AWS_SESSION_TOKEN(:|%3A))([^,&]+)/
  ];
  regexes.forEach(r => {
    uri = uri.replace(r, '<credentials>');
  });
  return uri;
}

async function createAndConnectTunnel(model) {
  if (model.sshTunnel === 'NONE') {
    return null;
  }

  debug('creating ssh tunnel');
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
  debug('connecting ...');

  const url = model.driverUrlWithSsh;
  const options = {
    ...model.driverOptions,

    // if `auth` is passed then username and password must be present
    // we remove this here as a safe-guard to make sure we don't get
    // an empty object that would break the connection.
    //
    // We could remove this line if we refactor connection model and we
    // have better control on what we get here.
    //
    // NOTE: please redact the options in the debug output of this file
    // if we start to use this object.
    auth: undefined
  };

  /** @type {SSHTunnel} */
  const tunnel = await createAndConnectTunnel(model);

  debug(
    'creating MongoClient with uri =',
    redactCredentials(url),
    'and options =',
    options
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

module.exports = util.callbackify(connect);
