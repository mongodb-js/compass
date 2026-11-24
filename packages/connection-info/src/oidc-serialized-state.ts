const OIDC_PLUGIN_STATE_VERSION = 1;

type SerializedOIDCPluginTokenSet = Record<string, unknown>;

interface SerializedOIDCPluginState {
  oidcPluginStateVersion?: number;
  state?: [
    string,
    { currentTokenSet?: { set?: SerializedOIDCPluginTokenSet } },
  ][];
}

/**
 * Removes the OIDC access token from the plugin's serialized state before it
 * is written to disk. The refresh token alone is enough to obtain a new access
 * token on reconnect, and it keeps the short-lived credential out of
 * persistent storage.
 *
 * Returns `undefined` if the state cannot be understood, so that callers can
 * drop it instead of risking persisting the access token.
 */
export function stripAccessTokenFromOIDCSerializedState(
  serializedState: string
): string | undefined {
  let state: SerializedOIDCPluginState;
  try {
    state = JSON.parse(Buffer.from(serializedState, 'base64').toString('utf8'));
  } catch {
    return undefined;
  }

  // The serialized format is an opaque, versioned plugin internal.
  if (
    state.oidcPluginStateVersion !== OIDC_PLUGIN_STATE_VERSION ||
    !Array.isArray(state.state)
  ) {
    return undefined;
  }

  try {
    for (const [, idpState] of state.state) {
      const tokenSet = idpState?.currentTokenSet?.set;
      if (!tokenSet) continue;
      delete tokenSet.access_token;
      // The plugin trusts `expiresAt` and would skip refreshing if the missing
      // access token still looked valid; force the refresh-token grant instead.
      tokenSet.expiresAt = 0;
    }
  } catch {
    return undefined;
  }

  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64');
}
