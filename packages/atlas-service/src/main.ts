import { shell } from 'electron';
import { URL, URLSearchParams } from 'url';
import * as plugin from '@mongodb-js/oidc-plugin';
import { oidcServerRequestHandler } from '@mongodb-js/devtools-connect';
// TODO(https://github.com/node-fetch/node-fetch/issues/1652): Remove this when
// node-fetch types match the built in AbortSignal from node.
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import type { SimplifiedSchema } from 'mongodb-schema';
import type { Document } from 'mongodb';
import type { AIQuery, IntrospectInfo, Token, UserInfo } from './util';
import { ipcExpose } from './util';

const redirectRequestHandler = oidcServerRequestHandler.bind(null, {
  productName: 'Compass',
  productDocsLink: 'https://www.mongodb.com/docs/compass',
});

const SPECIAL_AI_ERROR_NAME = 'AIError';

export async function throwIfNotOk(
  res: Pick<Response, 'ok' | 'status' | 'statusText' | 'json'>
) {
  if (res.ok) {
    return;
  }

  let serverErrorName = 'NetworkError';
  let serverErrorMessage = `${res.status} ${res.statusText}`;
  // Special case for AI endpoint only:
  // We try to parse the response to see if the server returned any information
  // we can show a user.
  try {
    // Why are we having a custom format and not following what mms does?
    const messageJSON = await res.json();
    if (messageJSON.name === SPECIAL_AI_ERROR_NAME) {
      serverErrorName = 'Error';
      serverErrorMessage = `${messageJSON.codeName as string}: ${
        messageJSON.errorMessage as string
      }`;
    }
  } catch (err) {
    // no-op, use the default status and statusText in the message.
  }
  const err = new Error(serverErrorMessage);
  err.name = serverErrorName;
  (err as any).statusCode = res.status;
  throw err;
}

const MAX_REQUEST_SIZE = 5000;

const MIN_SAMPLE_DOCUMENTS = 1;

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

  private static fetch: typeof fetch = fetch;

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

  private static get apiBaseUrl() {
    if (!process.env.DEV_AI_QUERY_ENDPOINT) {
      throw new Error(
        'No AI Query endpoint to fetch. Please set the environment variable `DEV_AI_QUERY_ENDPOINT`'
      );
    }
    return process.env.DEV_AI_QUERY_ENDPOINT;
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
      'getQueryFromUserPrompt',
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

  static async signIn({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<Token> {
    if (this.signInPromise) {
      return this.signInPromise;
    }
    try {
      if (signal?.aborted) {
        const err = signal.reason ?? new Error('This operation was aborted.');
        throw err;
      }

      this.signInPromise = (async () => {
        this.token =
          await this.plugin.mongoClientOptions.authMechanismProperties.REQUEST_TOKEN_CALLBACK(
            { clientId: this.clientId, issuer: this.issuer },
            {
              // Required driver specific stuff
              version: 0,
              // This seems to be just an abort signal? We probably can make it
              // explicit when adding a proper interface for this
              timeoutContext: signal,
            }
          );
        return this.token;
      })();
      return await this.signInPromise;
    } finally {
      this.signInPromise = null;
    }
  }

  static async getUserInfo({
    signal,
  }: { signal?: AbortSignal } = {}): Promise<UserInfo> {
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }

    const res = await this.fetch(`${this.issuer}/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
        Accept: 'application/json',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });

    await throwIfNotOk(res);

    return res.json();
  }

  static async introspect({ signal }: { signal?: AbortSignal } = {}) {
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }

    const url = new URL(`${this.issuer}/v1/introspect`);
    url.searchParams.set('client_id', this.clientId);

    const res = await this.fetch(url.toString(), {
      method: 'POST',
      body: new URLSearchParams([
        ['token', this.token?.accessToken ?? ''],
        ['token_hint', 'access_token'],
      ]),
      headers: {
        Accept: 'application/json',
      },
      signal: signal as NodeFetchAbortSignal | undefined,
    });

    await throwIfNotOk(res);

    return res.json() as Promise<IntrospectInfo>;
  }

  static async getQueryFromUserPrompt({
    signal,
    userPrompt,
    collectionName,
    schema,
    sampleDocuments,
  }: {
    userPrompt: string;
    collectionName: string;
    schema?: SimplifiedSchema;
    sampleDocuments?: Document[];
    signal?: AbortSignal;
  }) {
    if (signal?.aborted) {
      const err = signal.reason ?? new Error('This operation was aborted.');
      throw err;
    }

    let msgBody = JSON.stringify({
      userPrompt,
      collectionName,
      schema,
      sampleDocuments,
    });
    if (msgBody.length > MAX_REQUEST_SIZE) {
      // When the message body is over the max size, we try
      // to see if with fewer sample documents we can still perform the request.
      // If that fails we throw an error indicating this collection's
      // documents are too large to send to the ai.
      msgBody = JSON.stringify({
        userPrompt,
        collectionName,
        schema,
        sampleDocuments: sampleDocuments?.slice(0, MIN_SAMPLE_DOCUMENTS),
      });
      // Why this is not happening on the backend?
      if (msgBody.length > MAX_REQUEST_SIZE) {
        throw new Error(
          'Error: too large of a request to send to the ai. Please use a smaller prompt or collection with smaller documents.'
        );
      }
    }

    const res = await this.fetch(`${this.apiBaseUrl}/ai/api/v1/mql-query`, {
      signal: signal as NodeFetchAbortSignal | undefined,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token?.accessToken ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: msgBody,
    });

    await throwIfNotOk(res);

    return res.json() as Promise<AIQuery>;
  }
}
