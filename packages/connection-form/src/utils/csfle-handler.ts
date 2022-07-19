import { randomBytes } from 'crypto';
import { cloneDeep } from 'lodash';
import type { ConnectionOptions } from 'mongodb-data-service';
import type {
  AutoEncryptionOptions,
  AutoEncryptionTlsOptions,
  Document,
} from 'mongodb';
import type { KMSProviderName } from './csfle-kms-fields';
import { EJSON } from 'bson';

const DEFAULT_FLE_OPTIONS: NonNullable<ConnectionOptions['fleOptions']> = {
  storeCredentials: false,
  autoEncryption: undefined,
};

type KeysOfUnion<T> = T extends T ? keyof T : never;

export interface UpdateCsfleStoreCredentialsAction {
  type: 'update-csfle-store-credentials';
  value: boolean;
}

export interface UpdateCsfleAction {
  type: 'update-csfle-param';
  key: keyof AutoEncryptionOptions;
  value?: AutoEncryptionOptions[keyof AutoEncryptionOptions];
}

type KMSProviders = NonNullable<AutoEncryptionOptions['kmsProviders']>;
export interface UpdateCsfleKmsAction {
  type: 'update-csfle-kms-param';
  kmsProvider: KMSProviderName;
  key: KeysOfUnion<KMSProviders[keyof KMSProviders]>;
  value?: string;
}

export interface UpdateCsfleKmsTlsAction {
  type: 'update-csfle-kms-tls-param';
  kmsProvider: KMSProviderName;
  key: keyof AutoEncryptionTlsOptions;
  value?: string;
}

export function handleUpdateCsfleStoreCredentials({
  action,
  connectionOptions,
}: {
  action: UpdateCsfleStoreCredentialsAction;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        storeCredentials: action.value,
      },
    },
  };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: unsetAutoEncryptionIfEmpty(autoEncryption),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kms: any = {
    ...(autoEncryption.kmsProviders?.[action.kmsProvider] ?? {}),
  };
  if (!action.value) {
    delete kms[action.key];
  } else {
    kms[action.key] = action.value;
  }
  const kmsProviders = autoEncryption.kmsProviders ?? {};
  if (Object.keys(kms).length === 0) {
    delete kmsProviders[action.kmsProvider];
  } else {
    kmsProviders[action.kmsProvider] = kms;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: unsetAutoEncryptionIfEmpty({
          ...autoEncryption,
          kmsProviders,
        }),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tls: any = {
    ...(autoEncryption.tlsOptions?.[action.kmsProvider] ?? {}),
  };
  if (!action.value) {
    delete tls[action.key];
  } else {
    tls[action.key] = action.value;
  }
  const tlsOptions = autoEncryption.tlsOptions ?? {};
  if (Object.keys(tls).length === 0) {
    delete tlsOptions[action.kmsProvider];
  } else {
    tlsOptions[action.kmsProvider] = tls;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: unsetAutoEncryptionIfEmpty({
          ...autoEncryption,
          tlsOptions,
        }),
      },
    },
  };
}

// The driver creates an AutoEncrypter object if `.autoEncryption` has been set
// as an option, regardless of whether it is filled. Consequently, we need
// to set it to undefined explicitly if the user wants to disable automatic
// CSFLE entirely (indicated by removing all CSFLE options).
export function unsetAutoEncryptionIfEmpty(
  o?: AutoEncryptionOptions
): AutoEncryptionOptions | undefined {
  return o && hasAnyCsfleOption(o) ? o : undefined;
}

export function hasAnyCsfleOption(o: Readonly<AutoEncryptionOptions>): boolean {
  return !!(
    o.bypassAutoEncryption ||
    o.keyVaultNamespace ||
    o.schemaMap ||
    o.encryptedFieldsMap ||
    [
      ...Object.values(o.tlsOptions ?? {}),
      ...Object.values(o.kmsProviders ?? {}),
    ]
      .flatMap((o) => Object.values(o ?? {}))
      .filter(Boolean).length > 0
  );
}

export function editorTextToEncryptedFieldConfig(
  value: any,
  error: Error | null,
  variant: 'EJSON' | 'Shell',
  text: string
): Document | undefined {
  if (!text.trim()) {
    return undefined;
  }

  // We use `$compass`-prefixed strings here since the keys of
  // `encryptedFieldConfigMap` refer to databases and
  // those never contain `$`.
  let parsed: Document;
  if (typeof value !== 'object' || !value) {
    parsed = {};
  } else {
    parsed = value;
  }
  parsed['$compass.error'] = error?.message ?? null;
  parsed['$compass.rawText'] = text;
  parsed['$compass.ejson'] = EJSON.serialize(parsed);
  return parsed;
}

export function encryptedFieldConfigToEditorProps(
  config: Readonly<Document> | undefined
): { text: string } | { initialValue: any } {
  if (!config) {
    return { text: '' };
  }
  if (config['$compass.rawText']) {
    return { text: config['$compass.rawText'] };
  }
  const withoutCompassKeys = Object.fromEntries(
    Object.entries(config).filter(([key]) => !key.startsWith('$compass.'))
  );
  return { initialValue: withoutCompassKeys };
}

// The CSFLE encryptedFieldConfigMap contains BSON values, including
// UUIDs, which are not serialized correctly by the connection model.
// To account for this, we regenerate the actual values from its
// EJSON representation on connection form load.
export function adjustCSFLEParams(
  connectionOptions: Readonly<ConnectionOptions>
): ConnectionOptions {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryptionOptions = connectionOptions.fleOptions?.autoEncryption;
  if (autoEncryptionOptions?.schemaMap?.['$compass.error'] === null) {
    autoEncryptionOptions.schemaMap = EJSON.deserialize(
      autoEncryptionOptions.schemaMap['$compass.ejson']
    ) as Document;
  }
  if (autoEncryptionOptions?.encryptedFieldsMap?.['$compass.error'] === null) {
    autoEncryptionOptions.encryptedFieldsMap = EJSON.deserialize(
      autoEncryptionOptions.encryptedFieldsMap['$compass.ejson']
    ) as Document;
  }
  return connectionOptions;
}

export function randomLocalKey(): string {
  return randomBytes(96).toString('base64');
}
