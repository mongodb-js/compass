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
    timeout = 10000
  ) {
    const { client } = app;
    const connectionFormButtonElement = await client.$(Selectors.ShowConnectionFormButton);
    if (await connectionFormButtonElement.isDisplayed()) {
      await connectionFormButtonElement.click();
    }

    await client.clickVisible(Selectors.ConnectionFormHostnameTabButton);

    if (typeof host !== 'undefined') {
      const element = await client.$(Selectors.ConnectionFormInputHostname);
      await element.setValue(host);
    }

    if (typeof port !== 'undefined') {
      const element = await client.$(Selectors.ConnectionFormInputPort);
      await element.setValue(port);
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

    const authStrategyInputComponent = await client.$(
      Selectors.ConnectionFormInputAuthStrategy
    );
    await authStrategyInputComponent.selectByAttribute('value', authStrategy);

    if (typeof username !== 'undefined') {
      const kerberosPrincipalInputElement = await app.client.$(
        Selectors.ConnectionFormInputKerberosPrincipal
      );
      const ldapUsernameInputElement = await app.client.$(
        Selectors.ConnectionFormInputLDAPUsername
      );
      // TODO: No point in having different `name`s in UI, they are not used for
      // anything and all those map to `username` in driver options anyway
      if (await kerberosPrincipalInputElement.isDisplayed()) {
        const element = await client.$(Selectors.ConnectionFormInputKerberosPrincipal);
        await element.setValue(username);
      } else if (await ldapUsernameInputElement.isDisplayed()) {
        const element = await client.$(Selectors.ConnectionFormInputLDAPUsername);
        await element.setValue(username);
      } else {
        const element = await client.$(Selectors.ConnectionFormInputUsername);
        await element.setValue(username);
      }
    }

    if (typeof password !== 'undefined') {
      const ldapPasswordInputElement = await client.$(Selectors.ConnectionFormInputLDAPPassword);
      if (await ldapPasswordInputElement.isDisplayed()) {
        const element = await client.$(Selectors.ConnectionFormInputLDAPPassword);
        await element.setValue(password);
      } else {
        const element = await client.$(Selectors.ConnectionFormInputPassword);
        await element.setValue(password);
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

    const sslMethodInputComponent = await client.$(Selectors.ConnectionFormInputSSLMethod);
    await sslMethodInputComponent.selectByAttribute('value', sslMethod);

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

    const sshTunnelTypeInputComponent = await client.$(Selectors.ConnectionFormInputSSHTunnel);
    await sshTunnelTypeInputComponent.selectByAttribute('value', sshTunnel);

    if (typeof sshTunnelHostname !== 'undefined') {
      const element = await client.$('[name="sshTunnelHostname"]');
      await element.setValue(sshTunnelHostname);
    }

    if (typeof sshTunnelPort !== 'undefined') {
      const element = await client.$('[name="sshTunnelPort"]');
      await element.setValue(sshTunnelPort);
    }

    if (typeof sshTunnelUsername !== 'undefined') {
      const element = await client.$('[name="sshTunnelUsername"]');
      await element.setValue(sshTunnelUsername);
    }

    if (typeof sshTunnelPassword !== 'undefined') {
      const element = await client.$('[name="sshTunnelPassword"]');
      await element.setValue(sshTunnelPassword);
    }

    await client.doConnect(timeout);
  };
};
