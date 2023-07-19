import { shell } from 'electron';
import { URL, URLSearchParams } from 'url';
import * as plugin from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import type { IntrospectInfo, Token, UserInfo } from './util';
import { ipcExpose } from './util';

const redirectRequestHandler = oidcServerRequestHandler.bind(null, {
  productName: 'Compass',
  productDocsLink: 'https://www.mongodb.com/docs/compass',
});

function throwIfNotOk(res: Response) {
  if (res.ok) {
    return;
  }
  const err = new Error(`NetworkError: ${res.statusText}`);
  err.name = 'NetworkError';
  (err as any).statusCode = res.status;
  throw err;
}

export class AtlasService {
  private constructor() {
    // singleton
  }

  private static calledOnce = false;

  private static plugin = plugin.createMongoDBOIDCPlugin({
    redirectServerRequestHandler(data) {
      if (data.result === 'redirecting') {
        const { res, status, location } = data;
        res.statusCode = status;
        const redirectUrl = new URL(
          'https://account.mongodb.com/account/login'
        );
        redirectUrl.searchParams.set('fromURI', location);
        res.setHeader('Location', redirectUrl.toString());
        res.end();
        return;
      }

      redirectRequestHandler(data);
    },
    async openBrowser({ url }) {
      await shell.openExternal(url);
    },
  });

  private static token: Token | null = null;

  private static signInPromise: Promise<Token> | null = null;

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
    ipcExpose('AtlasService', this, [
      'getUserInfo',
      'introspect',
      'isAuthenticated',
      'signIn',
    ]);
  }

  static async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      return false;
    }
    try {
      return (await this.introspect()).active;
    } catch (err) {
      return false;
    }
  }

  static async signIn(): Promise<Token> {
    if (this.signInPromise) {
      return this.signInPromise;
    }
    try {
      this.signInPromise = (async () => {
        this.token =
          await this.plugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK(
            { clientId: this.clientId, issuer: this.issuer },
            // Required driver specific stuff
            { version: 0 }
          );
        return this.token;
      })();
      return await this.signInPromise;
    } finally {
      this.signInPromise = null;
    }
  }

  static async getUserInfo(): Promise<UserInfo> {
    const res = await fetch(`${this.issuer}/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
        Accept: 'application/json',
      },
    });
    throwIfNotOk(res);
    return res.json();
  }

  static async introspect() {
    const url = new URL(`${this.issuer}/v1/introspect`);
    url.searchParams.set('client_id', this.clientId);
    const res = await fetch(url.toString(), {
      method: 'POST',
      body: new URLSearchParams([
        ['token', this.token?.accessToken ?? ''],
        ['token_hint', 'access_token'],
      ]),
      headers: {
        Accept: 'application/json',
      },
    });
    throwIfNotOk(res);
    return res.json() as Promise<IntrospectInfo>;
  }
}
