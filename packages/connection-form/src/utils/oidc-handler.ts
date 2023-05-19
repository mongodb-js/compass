import type { ConnectionOptions } from 'mongodb-data-service';
import { cloneDeep } from 'lodash';

type OIDCOptions = ConnectionOptions['oidc'];

const DEFAULT_OIDC_OPTIONS: NonNullable<OIDCOptions> = {
  // TODO
};

export interface UpdateOIDCAction {
  type: 'update-oidc-param';
  key: keyof OIDCOptions;
  value?: OIDCOptions[keyof OIDCOptions];
}

export function handleUpdateOIDCParam({
  action,
  connectionOptions,
}: {
  action: UpdateOIDCAction;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const oidcOptions = {
    ...connectionOptions.oidc,
  };
  if (!action.value) {
    delete oidcOptions[action.key];
  } else {
    oidcOptions[action.key] = action.value;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      oidc: {
        ...DEFAULT_OIDC_OPTIONS,
        ...oidcOptions,
      },
    },
  };
}
