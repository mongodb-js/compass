import type { ConnectionOptions } from 'mongodb-data-service';
import { cloneDeep } from 'lodash';

export type OIDCOptions = NonNullable<ConnectionOptions['oidc']>;

export interface UpdateOIDCAction<
  K extends keyof OIDCOptions = keyof OIDCOptions
> {
  type: 'update-oidc-param';
  key: K;
  value: OIDCOptions[K];
}
export function handleUpdateOIDCParam<K extends keyof OIDCOptions>({
  action,
  connectionOptions,
}: {
  action: UpdateOIDCAction<K>;
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
        ...oidcOptions,
      },
    },
  };
}

export function adjustOIDCConnectionOptionsBeforeConnect({
  browserCommandForOIDCAuth,
  notifyDeviceFlow,
}: {
  browserCommandForOIDCAuth?: string;
  notifyDeviceFlow?: (deviceFlowInformation: {
    verificationUrl: string;
    userCode: string;
  }) => void;
}): (connectionOptions: Readonly<ConnectionOptions>) => ConnectionOptions {
  return (connectionOptions) => {
    const browserCommand = browserCommandForOIDCAuth;

    return {
      ...cloneDeep(connectionOptions),
      oidc: {
        ...cloneDeep(connectionOptions.oidc),
        ...(browserCommand
          ? {
              openBrowser: {
                command: browserCommand,
              },
            }
          : {}),
        /**
         * When connecting with oidc with the authorization flow `device-auth`,
         * we show a code and a url that the user then visits and inputs.
         */
        ...(notifyDeviceFlow ? { notifyDeviceFlow } : {}),
      },
    };
  };
}
