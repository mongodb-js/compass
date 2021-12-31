const Selectors = require('../selectors');

const defaultTimeoutMS = 30_000;

module.exports = function (app, page, commands) {
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
    timeout = defaultTimeoutMS
  ) {
    const connectionFormButton = page.locator(
      Selectors.ShowConnectionFormButton
    );
    if (await connectionFormButton.isVisible()) {
      await connectionFormButton.click();
    }

    await page.click(Selectors.ConnectionFormHostnameTabButton);

    if (typeof host !== 'undefined') {
      await page.fill(Selectors.ConnectionFormInputHostname, host);
    }

    if (typeof port !== 'undefined') {
      await page.fill(Selectors.ConnectionFormInputPort, port.toString());
    }

    if (srvRecord === true) {
      await page.click(Selectors.ConnectionFormInputSrvRecord);
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

    await page.selectOption(
      Selectors.ConnectionFormInputAuthStrategy,
      authStrategy
    );

    if (typeof username !== 'undefined') {
      const kerberosPrincipalInput = page.locator(
        Selectors.ConnectionFormInputKerberosPrincipal
      );
      const ldapUsernameInput = page.locator(
        Selectors.ConnectionFormInputLDAPUsername
      );
      // TODO: No point in having different `name`s in UI, they are not used for
      // anything and all those map to `username` in driver options anyway
      if (await kerberosPrincipalInput.isVisible()) {
        await page.fill(
          Selectors.ConnectionFormInputKerberosPrincipal,
          username
        );
      } else if (await ldapUsernameInput.isVisible()) {
        await page.fill(Selectors.ConnectionFormInputLDAPUsername, username);
      } else {
        await page.fill(Selectors.ConnectionFormInputUsername, username);
      }
    }

    if (typeof password !== 'undefined') {
      const ldapPasswordInput = page.locator(
        Selectors.ConnectionFormInputLDAPPassword
      );
      if (await ldapPasswordInput.isVisible()) {
        await page.fill(Selectors.ConnectionFormInputLDAPPassword, password);
      } else {
        await page.fill(Selectors.ConnectionFormInputPassword, password);
      }
    }

    if (typeof gssapiServiceName !== 'undefined') {
      // TODO: this should be a Selector.*
      await page.fill('[name="kerberos-service-name"]', gssapiServiceName);
    }

    // TODO: this should be a Selector.*
    await page.click('#More_Options');

    if (typeof replicaSet !== 'undefined') {
      await page.fill(Selectors.ConnectionFormInputReplicaSet, replicaSet);
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

    await page.selectOption(Selectors.ConnectionFormInputSSLMethod, sslMethod);

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

    await page.selectOption(Selectors.ConnectionFormInputSSHTunnel, sshTunnel);

    if (typeof sshTunnelHostname !== 'undefined') {
      // TODO: this should be a Selectors.*
      await page.fill('[name="sshTunnelHostname"]', sshTunnelHostname);
    }

    if (typeof sshTunnelPort !== 'undefined') {
      // TODO: this should be a Selectors.*
      await page.fill('[name="sshTunnelPort"]', sshTunnelPort);
    }

    if (typeof sshTunnelUsername !== 'undefined') {
      // TODO: this should be a Selectors.*
      await page.fill('[name="sshTunnelUsername"]', sshTunnelUsername);
    }

    if (typeof sshTunnelPassword !== 'undefined') {
      // TODO: this should be a Selectors.*
      await page.fill('[name="sshTunnelPassword"]', sshTunnelPassword);
    }

    await commands.doConnect(timeout);
  };
};
