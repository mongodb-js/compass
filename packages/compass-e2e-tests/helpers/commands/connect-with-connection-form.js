const Selectors = require('../selectors');

module.exports = function (app) {
  return async function connectWithConnectionForm(
    {
      host,
      port,
      srvRecord,
      username,
      password,
      authenticationMechanism,
      gssapiServiceName,
      replicaSet,
      tlsAllowInvalidHostnames,
      sslValidate,
      tlsCAFile,
      tlsCertificateKeyFile,
      sshTunnelHostname,
      sshTunnelPort,
      sshTunnelUsername,
      sshTunnelPassword,
      sshTunnelIdentityFile,
    },
    timeout
  ) {
    const { client } = app;

    if (await client.isVisible(Selectors.ShowConnectionFormButton)) {
      await client.click(Selectors.ShowConnectionFormButton);
    }

    await client.clickVisible(Selectors.ConnectionFormHostnameTabButton);

    if (typeof host !== 'undefined') {
      await client.setValue(Selectors.ConnectionFormInputHostname, host);
    }

    if (typeof port !== 'undefined') {
      await client.setValue(Selectors.ConnectionFormInputPort, port);
    }

    if (srvRecord === true) {
      await client.clickVisible(Selectors.ConnectionFormInputSrvRecord);
    }

    const authStrategy =
      authenticationMechanism === 'GSSAPI'
        ? 'KERBEROS'
        : authenticationMechanism === 'PLAIN'
        ? 'LDAP'
        : authenticationMechanism === 'MONGODB-X509'
        ? 'X509'
        : username || password
        ? 'MONGODB'
        : 'NONE';

    await client.selectByValue(
      Selectors.ConnectionFormInputAuthStrategy,
      authStrategy
    );

    if (typeof username !== 'undefined') {
      // TODO: No point in having different `name`s in UI, they are not used for
      // anything and all those map to `username` in driver options anyway
      if (
        await client.isVisible(Selectors.ConnectionFormInputKerberosPrincipal)
      ) {
        await client.setValue(
          Selectors.ConnectionFormInputKerberosPrincipal,
          username
        );
      } else if (
        await client.isVisible(Selectors.ConnectionFormInputLDAPUsername)
      ) {
        await client.setValue(
          Selectors.ConnectionFormInputLDAPUsername,
          username
        );
      } else {
        await client.setValue(Selectors.ConnectionFormInputUsername, username);
      }
    }

    if (typeof password !== 'undefined') {
      // TODO: See above
      if (await client.isVisible(Selectors.ConnectionFormInputLDAPPassword)) {
        await client.setValue(
          Selectors.ConnectionFormInputLDAPPassword,
          password
        );
      } else {
        await client.setValue(Selectors.ConnectionFormInputPassword, password);
      }
    }

    if (typeof gssapiServiceName !== 'undefined') {
      await client.setValue(
        '[name="kerberos-service-name"]',
        gssapiServiceName
      );
    }

    await client.clickVisible('#More_Options');

    if (typeof replicaSet !== 'undefined') {
      await client.setValue(
        Selectors.ConnectionFormInputReplicaSet,
        replicaSet
      );
    }

    const sslMethod =
      tlsAllowInvalidHostnames === true || sslValidate === false
        ? 'UNVALIDATED'
        : typeof tlsCAFile !== 'undefined' &&
          typeof tlsCertificateKeyFile !== 'undefined'
        ? 'ALL'
        : typeof tlsCAFile !== 'undefined'
        ? 'SERVER'
        : /mongodb.net$/.test(host)
        ? 'SYSTEMCA'
        : 'NONE';

    await client.selectByValue(
      Selectors.ConnectionFormInputSSLMethod,
      sslMethod
    );

    if (['ALL', 'SERVER'].includes(sslMethod)) {
      // TODO: Can be implemented after https://github.com/mongodb-js/compass/pull/2380
      throw new Error("Can't test connections that use SSL");
    }

    const sshTunnel =
      typeof sshTunnelPassword !== 'undefined'
        ? 'USER_PASSWORD'
        : typeof sshTunnelIdentityFile !== 'undefined'
        ? 'IDENTITY_FILE'
        : 'NONE';

    if (sshTunnel === 'IDENTITY_FILE') {
      // TODO: Can be implemented after https://github.com/mongodb-js/compass/pull/2380
      throw new Error(
        "Can't test connections that use identity file authentication for SSH tunnel"
      );
    }

    await client.selectByValue(
      Selectors.ConnectionFormInputSSHTunnel,
      sshTunnel
    );

    if (typeof sshTunnelHostname !== 'undefined') {
      await client.setValue('[name="sshTunnelHostname"]', sshTunnelHostname);
    }

    if (typeof sshTunnelPort !== 'undefined') {
      await client.setValue('[name="sshTunnelPort"]', sshTunnelPort);
    }

    if (typeof sshTunnelUsername !== 'undefined') {
      await client.setValue('[name="sshTunnelUsername"]', sshTunnelUsername);
    }

    if (typeof sshTunnelPassword !== 'undefined') {
      await client.setValue('[name="sshTunnelPassword"]', sshTunnelPassword);
    }

    await client.doConnect(timeout);
  };
};
