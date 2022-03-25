import { cloneDeep } from 'lodash';
import type { ConnectionOptions } from 'mongodb-data-service';
import type { AutoEncryptionOptions, AutoEncryptionTlsOptions } from 'mongodb';

type KeysOfUnion<T> = T extends T ? keyof T : never;

export interface UpdateCsfleAction {
  type: 'update-csfle-param';
  key: keyof AutoEncryptionOptions;
  value?: string;
}

type KMSProviders = NonNullable<AutoEncryptionOptions['kmsProviders']>;
export interface UpdateCsfleKmsAction {
  type: 'update-csfle-kms-param';
  kms: keyof KMSProviders;
  key: KeysOfUnion<KMSProviders[keyof KMSProviders]>;
  value?: string;
}

export interface UpdateCsfleKmsTlsAction {
  type: 'update-csfle-kms-tls-param';
  kms: keyof KMSProviders;
  key: keyof AutoEncryptionTlsOptions;
  value?: string;
}

export function handleUpdateCsfleParam({
  action,
  connectionOptions,
}: {
  action: UpdateCsfleAction;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption: any = {
    ...connectionOptions.fleOptions?.autoEncryption,
  };
  if (!action.value) {
    delete autoEncryption[action.key];
  } else {
    autoEncryption[action.key] = action.value;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        storeCredentials: false,
        ...connectionOptions.fleOptions,
        autoEncryption,
      },
    },
  };
}

export function handleUpdateCsfleKmsParam({
  action,
  connectionOptions,
}: {
  action: UpdateCsfleKmsAction;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};
  let kms: any = { ...(autoEncryption.kmsProviders?.[action.kms] ?? {}) };
  if (!action.value) {
    delete kms[action.key];
  } else {
    kms[action.key] = action.value;
  }
  if (Object.keys(kms).length === 0) {
    kms = undefined;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        storeCredentials: false,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          kmsProviders: {
            ...autoEncryption.kmsProviders,
            [action.kms]: kms,
          },
        },
      },
    },
  };
}

export function handleUpdateCsfleKmsTlsParam({
  action,
  connectionOptions,
}: {
  action: UpdateCsfleKmsTlsAction;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};
  let tls: any = { ...(autoEncryption.tlsOptions?.[action.kms] ?? {}) };
  if (!action.value) {
    delete tls[action.key];
  } else {
    tls[action.key] = action.value;
  }
  if (Object.keys(tls).length === 0) {
    tls = undefined;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        storeCredentials: false,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          tlsOptions: {
            ...autoEncryption.tlsOptions,
            [action.kms]: tls,
          },
        },
      },
    },
  };
}

export function hasAnyCsfleOption(o: Readonly<AutoEncryptionOptions>): boolean {
  return !!(
    o.bypassAutoEncryption ||
    o.keyVaultNamespace ||
    o.schemaMap /* TODO(COMPASS-5645): encryptedFieldConfig */ ||
    [
      ...Object.values(o.tlsOptions ?? {}),
      ...Object.values(o.kmsProviders ?? {}),
    ]
      .flatMap((o) => Object.values(o))
      .filter(Boolean).length > 0
  );
}
