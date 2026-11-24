import { expect } from 'chai';

import { stripAccessTokenFromOIDCSerializedState } from './oidc-serialized-state';

function serialize(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
}

function deserialize(value: string | undefined): any {
  if (value === undefined) return undefined;
  return JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
}

describe('stripAccessTokenFromOIDCSerializedState', function () {
  const serializedState = serialize({
    oidcPluginStateVersion: 1,
    state: [
      [
        'idp-key',
        {
          id: 'auth-state',
          serverOIDCMetadata: { issuer: 'https://idp.example.com' },
          currentTokenSet: {
            set: {
              access_token: 'access-token',
              id_token: 'id-token',
              refresh_token: 'refresh-token',
              token_type: 'Bearer',
              expiresAt: 1234567890,
              claims: { exp: 1234567890, sub: 'user', aud: 'audience' },
            },
          },
          lastIdTokenClaims: { aud: 'audience', sub: 'user' },
          discardingTokenSets: [],
        },
      ],
    ],
  });

  it('removes the access token and expiry', function () {
    const state = deserialize(
      stripAccessTokenFromOIDCSerializedState(serializedState)
    );
    const tokenSet = state.state[0][1].currentTokenSet.set;

    expect(tokenSet).to.not.have.property('access_token');
    expect(tokenSet).to.have.property('expiresAt', 0);
  });

  it('keeps the tokens and metadata needed to reconnect', function () {
    const state = deserialize(
      stripAccessTokenFromOIDCSerializedState(serializedState)
    );
    const idpState = state.state[0][1];

    expect(idpState.currentTokenSet.set).to.include({
      id_token: 'id-token',
      refresh_token: 'refresh-token',
      token_type: 'Bearer',
    });
    expect(idpState.serverOIDCMetadata).to.deep.equal({
      issuer: 'https://idp.example.com',
    });
    expect(idpState.lastIdTokenClaims).to.deep.equal({
      aud: 'audience',
      sub: 'user',
    });
  });

  it('returns undefined for unparseable state', function () {
    expect(stripAccessTokenFromOIDCSerializedState('not-valid')).to.equal(
      undefined
    );
  });

  it('returns undefined for a null parsed state', function () {
    expect(stripAccessTokenFromOIDCSerializedState(serialize(null))).to.equal(
      undefined
    );
  });

  it('returns undefined for a primitive parsed state', function () {
    expect(stripAccessTokenFromOIDCSerializedState(serialize(42))).to.equal(
      undefined
    );
  });

  it('returns undefined for an unknown state version', function () {
    expect(
      stripAccessTokenFromOIDCSerializedState(
        serialize({ oidcPluginStateVersion: 2, state: [] })
      )
    ).to.equal(undefined);
  });

  it('handles states without a token set', function () {
    const state = deserialize(
      stripAccessTokenFromOIDCSerializedState(
        serialize({ oidcPluginStateVersion: 1, state: [['idp-key', {}]] })
      )
    );

    expect(state).to.deep.equal({
      oidcPluginStateVersion: 1,
      state: [['idp-key', {}]],
    });
  });
});
