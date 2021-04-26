import { ConnectionString } from '@mongosh/service-provider-core';

/**
 * Takes the connection options for the driver v3.6 and converts
 * them into connection options for the driver v4.0.
 *
 * @param {string} oldDriverUrl
 *  3.6 connection string
 * @param {object} oldDriverOptions
 *  3.6 connection options
 * @param {object} connectionModelDriverOptions
 *  raw driver options from connection model
 * @returns {Array<string,object>}
 *  connection string and options suitable to connect with the driver v4.0
 */
export function adaptDriverV36ConnectionParams(
  oldDriverUrl,
  oldDriverOptions,
  connectionModelDriverOptions
) {
  const newDriverOptions = {
    ...oldDriverOptions
  };

  delete newDriverOptions.useUnifiedTopology;
  delete newDriverOptions.connectWithNoPrimary;
  delete newDriverOptions.useNewUrlParser;

  // `true` is not a valid tls checkServerIdentity option that seems to break
  // driver 4
  //
  // TODO(NODE-3061): Remove when fixed on driver side
  if (newDriverOptions.checkServerIdentity === true) {
    delete newDriverOptions.checkServerIdentity;
  }

  // driver 4 doesn't support certificates as buffers, so let's copy paths
  // back from model `driverOptions`
  //
  // TODO: Driver is not sure if buffer behavior was a bug or a feature,
  // hopefully this can be removed eventually (see https://mongodb.slack.com/archives/C0V8RU15L/p1612347025017200)
  ['sslCA', 'sslCRL', 'sslCert', 'sslKey'].forEach((key) => {
    if (
      newDriverOptions[key] && connectionModelDriverOptions[key]
    ) {
    // Option value can be array or a string in connection-model, we'll
    // unwrap it if it's an array (it's always an array with one value)
      const option = connectionModelDriverOptions[key];
      newDriverOptions[key] = Array.isArray(option) ? option[0] : option;
    }
  });

  return extractGssapiServiceName(oldDriverUrl, newDriverOptions);
}

function extractGssapiServiceName(oldDriverUrl, newDriverOptions) {
  const uri = new ConnectionString(oldDriverUrl);

  const gssapiServiceName = uri.searchParams.get('gssapiServiceName');

  uri.searchParams.delete('gssapiServiceName');

  if (gssapiServiceName) {
    newDriverOptions.authMechanismProperties = {
      ...newDriverOptions.authMechanismProperties,
      gssapiServiceName,
    };
  }

  return [uri.toString(), newDriverOptions];
}
