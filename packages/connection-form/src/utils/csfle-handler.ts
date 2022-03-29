import { cloneDeep } from 'lodash';
import type { ConnectionOptions } from 'mongodb-data-service';
import type {
  AutoEncryptionOptions,
  AutoEncryptionTlsOptions,
  Document,
} from 'mongodb';
import queryParser from 'mongodb-query-parser';

type KeysOfUnion<T> = T extends T ? keyof T : never;

export interface UpdateCsfleAction {
  type: 'update-csfle-param';
  key: keyof AutoEncryptionOptions;
  value?: AutoEncryptionOptions[keyof AutoEncryptionOptions];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function textToEncryptedFieldConfig(text: string): Document {
  // We use `$compass`-prefixed strings here since the keys of
  // `encryptedFieldConfigMap` refer to databases and
  // those never contain `$`.

  let parsed: Document = {};
  try {
    parsed = queryParser(text);
    parsed['$compass.error'] = null;
  } catch (err: unknown) {
    parsed['$compass.error'] = (err as Error).message;
  }

  parsed['$compass.rawText'] = text;
  return parsed;
}

export function encryptedFieldConfigToText(config: Document): string {
  if (config['$compass.rawText']) {
    return config['$compass.rawText'];
  }
  const withoutCompassKeys = Object.fromEntries(
    Object.entries(config).filter(([key]) => !key.startsWith('$compass.'))
  );
  return queryParser.toJSString(withoutCompassKeys);
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
  // TODO(COMPASS-5645): schemaMap -> encryptedFieldConfig[Map?]
  if (autoEncryptionOptions?.schemaMap?.['$compass.error'] === null) {
    autoEncryptionOptions.schemaMap = textToEncryptedFieldConfig(
      autoEncryptionOptions.schemaMap['$compass.rawText']
    );
  }
  return connectionOptions;
}
