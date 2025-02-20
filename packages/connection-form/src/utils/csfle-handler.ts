import { randomBytes } from 'crypto';
import { cloneDeep } from 'lodash';
import type { ConnectionOptions } from 'mongodb-data-service';
import type {
  AutoEncryptionOptions,
  ClientEncryptionTlsOptions,
  Document,
} from 'mongodb';
import type {
  KMSProviderName,
  KMSProviderType,
  KMSTLSProviderName,
  KMSTLSProviderType,
} from './csfle-kms-fields';
import { toJSString } from 'mongodb-query-parser';
import parseShellStringToEJSON, {
  ParseMode,
} from '@mongodb-js/shell-bson-parser';

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
export interface AddCsfleProviderAction<
  T extends KMSProviderType = KMSProviderType
> {
  type: 'add-new-csfle-kms-provider';
  name: KMSProviderName<T>;
}
export interface RenameCsfleProviderAction<
  T extends KMSProviderType = KMSProviderType
> {
  type: 'rename-csfle-kms-provider';
  name: KMSProviderName<T>;
  newName: KMSProviderName<T>;
}
export interface RemoveCsfleProviderAction<
  T extends KMSProviderType = KMSProviderType
> {
  type: 'remove-csfle-kms-provider';
  name: KMSProviderName<T>;
}

type KMSProviders = NonNullable<AutoEncryptionOptions['kmsProviders']>;
export interface UpdateCsfleKmsAction<
  T extends KMSProviderType = KMSProviderType
> {
  type: 'update-csfle-kms-param';
  kmsProviderName: KMSProviderName<T>;
  key: KeysOfUnion<KMSProviders[keyof KMSProviders]>;
  value?: string;
}

export interface UpdateCsfleKmsTlsAction<
  T extends KMSTLSProviderType = KMSTLSProviderType
> {
  type: 'update-csfle-kms-tls-param';
  kmsProviderName: KMSTLSProviderName<T>;
  key: keyof ClientEncryptionTlsOptions;
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
        autoEncryption,
      },
    },
  };
}

export function handleUpdateCsfleKmsParam<T extends KMSProviderType>({
  action,
  connectionOptions,
}: {
  action: UpdateCsfleKmsAction<T>;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kms: any = {
    ...(autoEncryption.kmsProviders?.[
      action.kmsProviderName as keyof KMSProviders
    ] ?? {}),
  };
  if (!action.value) {
    delete kms[action.key];
  } else {
    kms[action.key] = action.value;
  }
  const kmsProviders = autoEncryption.kmsProviders ?? {};
  if (Object.keys(kms).length === 0) {
    delete kmsProviders[action.kmsProviderName as keyof KMSProviders];
  } else {
    kmsProviders[action.kmsProviderName as keyof KMSProviders] = kms;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          kmsProviders,
        },
      },
    },
  };
}

export function handleUpdateCsfleKmsTlsParam<T extends KMSTLSProviderType>({
  action,
  connectionOptions,
}: {
  action: UpdateCsfleKmsTlsAction<T>;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tls: any = {
    ...(autoEncryption.tlsOptions?.[action.kmsProviderName] ?? {}),
  };
  if (!action.value) {
    delete tls[action.key];
  } else {
    tls[action.key] = action.value;
  }
  const tlsOptions = autoEncryption.tlsOptions ?? {};
  if (Object.keys(tls).length === 0) {
    delete tlsOptions[action.kmsProviderName];
  } else {
    tlsOptions[action.kmsProviderName] = tls;
  }
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          tlsOptions,
        },
      },
    },
  };
}

// The driver creates an AutoEncrypter object if `.autoEncryption` has been set
// as an option, regardless of whether it is filled. Consequently, we need
// to set it to undefined explicitly if the user wants to disable automatic
// CSFLE entirely (indicated by removing all CSFLE options).
export function unsetFleOptionsIfEmptyAutoEncryption(
  connectionOptions: Readonly<ConnectionOptions>
): ConnectionOptions {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption =
    connectionOptions.fleOptions?.autoEncryption &&
    hasAnyCsfleOption(connectionOptions.fleOptions?.autoEncryption)
      ? connectionOptions.fleOptions?.autoEncryption
      : undefined;

  if (!autoEncryption) {
    return {
      ...connectionOptions,
      fleOptions: undefined,
    };
  }

  function filterEmptyValues<T extends object>(
    obj: T | undefined
  ): { [k in keyof T]: Exclude<T[k], Record<string, never>> } | undefined {
    const values = Object.fromEntries(
      Object.entries(obj ?? {}).filter(
        ([, v]) => Object.keys(v ?? {}).length > 0
      )
    );
    return Object.keys(values).length > 0
      ? (values as { [k in keyof T]: Exclude<T[k], Record<string, never>> })
      : undefined;
  }
  // Filter out the empty kmsProviders or the tlsOptions
  const kmsProviders = filterEmptyValues(autoEncryption.kmsProviders);
  const tlsOptions = filterEmptyValues(autoEncryption.tlsOptions);

  const {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    kmsProviders: _1,
    tlsOptions: _2,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...restOfTheAutoEncryption
  } = autoEncryption;

  return {
    ...connectionOptions,
    fleOptions: {
      ...DEFAULT_FLE_OPTIONS,
      ...connectionOptions.fleOptions,
      autoEncryption: {
        ...restOfTheAutoEncryption,
        ...(kmsProviders ? { kmsProviders } : {}),
        ...(tlsOptions ? { tlsOptions } : {}),
      },
    },
  };
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

export function textToEncryptedFieldConfig(text: string): Document | undefined {
  if (!text.trim()) {
    return undefined;
  }

  // We use `$compass`-prefixed strings here since the keys of
  // `encryptedFieldConfigMap` refer to databases and
  // those never contain `$`.

  let parsed: Document = {};
  try {
    parsed = parseShellStringToEJSON(text, {
      mode: ParseMode.Strict,
    });
    if (!parsed || typeof parsed !== 'object') {
      // XXX(COMPASS-5689): We've hit the condition in
      // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
      // in which instead of returning a parsed value or throwing an error,
      // the query parser just returns an empty string when encountering
      // input that can be parsed as JS but not as a valid query.
      // Unfortunately, this also means that all context around what
      // caused this error is unavailable here.
      parsed = {};
      throw new Error('Field contained invalid input');
    }
    parsed['$compass.error'] = null;
  } catch (err: unknown) {
    parsed['$compass.error'] = (err as Error).message;
  }

  parsed['$compass.rawText'] = text;
  return parsed;
}

export function encryptedFieldConfigToText(
  config: Readonly<Document> | undefined
): string {
  if (!config) {
    return '';
  }
  if (config['$compass.rawText']) {
    return config['$compass.rawText'];
  }
  const withoutCompassKeys = Object.fromEntries(
    Object.entries(config).filter(([key]) => !key.startsWith('$compass.'))
  );
  return toJSString(withoutCompassKeys) || '';
}

// The CSFLE encryptedFieldConfigMap contains BSON values, including
// UUIDs, which are not serialized correctly by the connection model.
// To account for this, we regenerate the actual values from its
// text representation on connection form load.
export function adjustCSFLEParams(
  connectionOptions: Readonly<ConnectionOptions>
): ConnectionOptions {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryptionOptions = connectionOptions.fleOptions?.autoEncryption;
  if (autoEncryptionOptions?.schemaMap?.['$compass.error'] === null) {
    autoEncryptionOptions.schemaMap = textToEncryptedFieldConfig(
      autoEncryptionOptions.schemaMap['$compass.rawText']
    );
  }
  if (autoEncryptionOptions?.encryptedFieldsMap?.['$compass.error'] === null) {
    autoEncryptionOptions.encryptedFieldsMap = textToEncryptedFieldConfig(
      autoEncryptionOptions.encryptedFieldsMap['$compass.rawText']
    );
  }
  return connectionOptions;
}

export function randomLocalKey(): string {
  return randomBytes(96).toString('base64');
}

export function handleAddKmsProvider<T extends KMSProviderType>({
  action,
  connectionOptions,
}: {
  action: AddCsfleProviderAction<T>;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);

  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};
  const kmsProviders = autoEncryption.kmsProviders ?? {};
  kmsProviders[action.name as keyof KMSProviders] = {} as any;

  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          kmsProviders,
        },
      },
    },
  };
}

// In order to ensure that the order of the keys is preserved, we need to
// delete the old key and insert the new key at the same position.
function renameDataKey<T extends Document>(
  data: T | undefined,
  oldKey: keyof T,
  newKey: string
): Document | undefined {
  if (!data) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key === oldKey ? newKey : key,
      value,
    ])
  );
}

export function handleRenameKmsProvider<T extends KMSProviderType>({
  action,
  connectionOptions,
}: {
  action: RenameCsfleProviderAction<T>;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};

  const kmsProviders = renameDataKey(
    autoEncryption.kmsProviders,
    action.name,
    action.newName
  );
  const tlsOptions = renameDataKey(
    autoEncryption.tlsOptions,
    action.name,
    action.newName
  );
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          ...(kmsProviders && { kmsProviders }),
          ...(tlsOptions && { tlsOptions }),
        },
      },
    },
  };
}

export function handleRemoveKmsProvider<T extends KMSProviderType>({
  action,
  connectionOptions,
}: {
  action: RemoveCsfleProviderAction<T>;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  connectionOptions = cloneDeep(connectionOptions);
  const autoEncryption = connectionOptions.fleOptions?.autoEncryption ?? {};
  const kmsProviders = autoEncryption.kmsProviders ?? {};
  delete kmsProviders[action.name as keyof KMSProviders];
  const tlsOptions = autoEncryption.tlsOptions ?? {};
  delete tlsOptions[action.name as keyof KMSProviders];
  return {
    connectionOptions: {
      ...connectionOptions,
      fleOptions: {
        ...DEFAULT_FLE_OPTIONS,
        ...connectionOptions.fleOptions,
        autoEncryption: {
          ...autoEncryption,
          kmsProviders,
          tlsOptions,
        },
      },
    },
  };
}
