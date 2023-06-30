import { ipcMain, shell } from 'electron';
import { URLSearchParams } from 'url';
import * as plugin from '@mongodb-js/oidc-plugin';
import fetch from 'node-fetch';
import type { IntrospectInfo, Token, UserInfo } from './shared';
import { Events } from './shared';

export class AtlasSignIn {
  private constructor() {
    // singleton
  }

  private static calledOnce = false;

  private static plugin = plugin.createMongoDBOIDCPlugin({
    // TODO: as auth is done through the localhost loopback and not directly
    // through customer okta, we will need to implement screens for following
    // states: initial, success, error, not found; waiting for the designs
    // redirectServerRequestHandler() {
    // }
    async openBrowser({ url }) {
      await shell.openExternal(url);
    },
  });

  private static token: Token | null = null;

  private static get clientId() {
    if (!process.env.COMPASS_CLIENT_ID) {
      throw new Error('COMPASS_CLIENT_ID is required');
    }
    return process.env.COMPASS_CLIENT_ID;
  }

  private static get issuer() {
    if (!process.env.COMPASS_OIDC_ISSUER) {
      throw new Error('COMPASS_OIDC_ISSUER is required');
    }
    return process.env.COMPASS_OIDC_ISSUER;
  }

  static init() {
    if (this.calledOnce) {
      return;
    }
    this.calledOnce = true;
    ipcMain.handle(Events.SignIn, async () => {
      this.token =
        // TODO: provide better interface in the oidc-plugin so that we don't
        // need to call internal callbacks
        await this.plugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK(
          { clientId: this.clientId, issuer: this.issuer },
          // Required driver specific stuff
          { version: 0 }
        );
      this.setupTokenRefresh();
      return this.token;
    });
    ipcMain.handle(Events.IsAuthenticated, async () => {
      if (!this.token) {
        return false;
      }
      try {
        return (await this.introspect()).active;
      } catch (err) {
        return false;
      }
    });
    ipcMain.handle(Events.UserInfo, async () => {
      return await this.getUserInfo();
    });
  }

  // TODO: good-ish enough for POC, but we will have reimplement something
  // similar to https://github.com/okta/okta-auth-js#tokenmanageronevent-callback-context
  private static setupTokenRefresh() {
    setTimeout(
      () => {
        void this.plugin.mongoClientOptions.authMechanismProperties
          .REFRESH_TOKEN_CALLBACK(
            { clientId: this.clientId, issuer: this.issuer },
            // Required driver specific stuff
            { version: 0 }
          )
          .then((token) => {
            this.token = token;
            this.setupTokenRefresh();
          });
      },
      Math.max(
        // Min idle is 10mins
        10 * 60 * 1000,
        ((this.token?.expiresInSeconds ?? 0) * 1000) / 2
      )
    ).unref();
  }

  private static persistToken() {
    // TODO: implement something like https://github.com/okta/okta-auth-js#storageprovider
    // so that we can persist the token between sessions
  }

  private static restoreToken() {
    // TODO: implement something like https://github.com/okta/okta-auth-js#storageprovider
    // so that we can persist the token between sessions
  }

  private static getUserInfo(): UserInfo {
    return fetch(`${this.issuer}/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
      },
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      const err = new Error(res.statusText);
      (err as any).status = res.status;
      throw err;
    });
  }

  private static introspect() {
    return fetch(`${this.issuer}/v1/introspect?client_id=${this.clientId}`, {
      method: 'POST',
      body: new URLSearchParams([
        ['token', this.token?.accessToken ?? ''],
        ['token_hint', 'access_token'],
      ]),
      headers: {
        Accept: 'application/json',
      },
    }).then((res) => {
      if (res.ok) {
        return res.json() as Promise<IntrospectInfo>;
      }
      const err = new Error(res.statusText);
      (err as any).status = res.status;
      throw err;
    });
  }
}
