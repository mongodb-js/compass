import type { ConnectionOptions } from 'mongodb-data-service';
import { cloneDeep } from 'lodash';

type OIDCOptions = NonNullable<ConnectionOptions['oidc']>;

export interface UpdateOIDCAction {
  type: 'update-oidc-param';
  key: keyof OIDCOptions;
  value: OIDCOptions[keyof OIDCOptions];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oidcOptions: any = {};
  if (!action.value) {
    delete oidcOptions[action.key];
  } else {
    oidcOptions[action.key] = action.value;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      oidc: {
        ...oidcOptions,
      },
    },
  };
}
