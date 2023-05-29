import type { ConnectionOptions } from 'mongodb-data-service';
import { cloneDeep } from 'lodash';

export type OIDCOptions = NonNullable<ConnectionOptions['oidc']>;

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
  const oidcOptions: any = {
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

/**
 * When connecting with oidc with the authorization flow `device-auth`,
 * we show a code and a url that the user then visits and inputs.
 */
export function setOIDCNotifyDeviceFlow(
  notifyDeviceFlow?: (deviceFlowInformation: {
    verificationUrl: string;
    userCode: string;
  }) => void
): (connectionOptions: Readonly<ConnectionOptions>) => ConnectionOptions {
  return (connectionOptions) => {
    if (!notifyDeviceFlow) {
      return connectionOptions;
    }

    return {
      ...cloneDeep(connectionOptions),
      oidc: {
        ...cloneDeep(connectionOptions.oidc),
        notifyDeviceFlow,
      },
    };
  };
}
