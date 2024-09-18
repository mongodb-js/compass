import type { KMSProviders } from 'mongodb';
import type { ConnectionFormError } from './validation';
import { errorMessageByFieldName, fieldNameHasError } from './validation';
export type {
  ClientEncryptionTlsOptions,
  KMSProviders,
  LocalKMSProviderConfiguration,
} from 'mongodb';
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type KMSOption<KMSProvider extends KMSProviderType> = KeysOfUnion<
  NonNullable<KMSProviders[KMSProvider]>
>;
export type KMSProviderType = Extract<
  keyof KMSProviders,
  'aws' | 'gcp' | 'azure' | 'kmip' | 'local'
>;
export type KMSProviderName<T extends KMSProviderType> = T | `${T}:${string}`;
export type KMSTLSProviderType = KMSProviderType;
export type KMSTLSProviderName<T extends KMSProviderType> = KMSProviderName<T>;

export interface KMSField<T extends KMSProviderType> {
  name: KMSOption<T>;
  label: string;
  type: 'password' | 'text' | 'textarea';
  optional: boolean;
  value: (
    autoEncryption: { kmsProviders?: KMSProviders },
    kmsProviderName: KMSProviderName<T>
  ) => string;
  errorMessage?: (
    errors: ConnectionFormError[],
    kmsProviderName: KMSProviderName<T>
  ) => string | undefined;
  state:
    | 'error'
    | 'none'
    | ((errors: ConnectionFormError[]) => 'error' | 'none');
  description?: string;
}

// Best understood in a TS playground: https://tinyurl.com/3hdz2msn
// This type hackery became necessary because some of the KMS options became
// union types, e.g. { ... } | { accessToken: string }.
type DecayUnion<T> = {
  [k in T extends T ? keyof T : never]?: (T &
    Partial<Record<string, never>>)[k];
} & T;
function decayUnion<T extends object>(value: T): DecayUnion<T> {
  return value;
}
const empty: Record<string, never> = {};

const GCPFields: KMSField<'gcp'>[] = [
  {
    name: 'email',
    label: 'Service Account E-Mail',
    type: 'text',
    optional: false,
    value: (autoEncryption, provider) =>
      decayUnion(autoEncryption?.kmsProviders?.[provider] ?? empty)?.email ??
      '',
    state: 'none',
    description: 'The service account email to authenticate.',
  },
  {
    name: 'privateKey',
    label: 'Private Key',
    type: 'textarea',
    optional: false,
    value: (autoEncryption, provider) =>
      decayUnion(
        autoEncryption?.kmsProviders?.[provider] ?? empty
      )?.privateKey?.toString('base64') ?? '',
    state: 'none',
    description: 'A base64-encoded PKCS#8 private key.',
  },
  {
    name: 'endpoint',
    label: 'Endpoint',
    type: 'text',
    optional: true,
    value: (autoEncryption, provider) =>
      decayUnion(autoEncryption?.kmsProviders?.[provider] ?? empty)?.endpoint ??
      '',
    state: 'none',
    description: 'A host with an optional port.',
  },
];

const AWSFields: KMSField<'aws'>[] = [
  {
    name: 'accessKeyId',
    label: 'Access Key ID',
    type: 'text',
    optional: false,
    value: (autoEncryption, provider) =>
      autoEncryption?.kmsProviders?.[provider]?.accessKeyId ?? '',
    state: 'none',
    description: 'The access key used for the AWS KMS provider.',
  },
  {
    name: 'secretAccessKey',
    label: 'Secret Access Key',
    type: 'password',
    optional: false,
    value: (autoEncryption, provider) =>
      autoEncryption?.kmsProviders?.[provider]?.secretAccessKey ?? '',
    state: 'none',
    description: 'The secret access key used for the AWS KMS provider.',
  },
  {
    name: 'sessionToken',
    label: 'Session Token',
    type: 'password',
    optional: true,
    value: (autoEncryption, provider) =>
      autoEncryption?.kmsProviders?.[provider]?.sessionToken ?? '',
    state: 'none',
    description:
      'An optional AWS session token that will be used as the X-Amz-Security-Token header for AWS requests.',
  },
];

const AzureFields: KMSField<'azure'>[] = [
  {
    name: 'tenantId',
    label: 'Tenant ID',
    type: 'text',
    optional: false,
    value: (autoEncryption, provider) =>
      decayUnion(autoEncryption?.kmsProviders?.[provider] ?? empty)?.tenantId ??
      '',
    state: 'none',
    description: 'The tenant ID identifies the organization for the account.',
  },
  {
    name: 'clientId',
    label: 'Client ID',
    type: 'text',
    optional: false,
    value: (autoEncryption, provider) =>
      decayUnion(autoEncryption?.kmsProviders?.[provider] ?? empty)?.clientId ??
      '',
    state: 'none',
    description: 'The client ID to authenticate a registered application.',
  },
  {
    name: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    optional: false,
    value: (autoEncryption, provider) =>
      decayUnion(autoEncryption?.kmsProviders?.[provider] ?? empty)
        ?.clientSecret ?? '',
    state: 'none',
    description: 'The client secret to authenticate a registered application.',
  },
  {
    name: 'identityPlatformEndpoint',
    label: 'Identity Platform Endpoint',
    type: 'text',
    optional: true,
    value: (autoEncryption, provider) =>
      decayUnion(autoEncryption?.kmsProviders?.[provider] ?? empty)
        ?.identityPlatformEndpoint ?? '',
    state: 'none',
    description: 'A host with an optional port.',
  },
];

const KMIPFields: KMSField<'kmip'>[] = [
  {
    name: 'endpoint',
    label: 'Endpoint',
    type: 'text',
    optional: false,
    value: (autoEncryption, provider) =>
      autoEncryption?.kmsProviders?.[provider]?.endpoint ?? '',
    errorMessage: (errors) => errorMessageByFieldName(errors, 'kmip.endpoint'),
    state: (errors) =>
      fieldNameHasError(errors, 'kmip.endpoint') ? 'error' : 'none',
    description:
      'The endpoint consists of a hostname and port separated by a colon.',
  },
];

const LocalFields: KMSField<'local'>[] = [
  {
    name: 'key',
    label: 'Key',
    type: 'text',
    optional: false,
    value: (autoEncryption, provider) =>
      autoEncryption?.kmsProviders?.[provider]?.key?.toString('base64') ?? '',
    errorMessage: (errors, provider) =>
      errorMessageByFieldName(errors, `${provider}.key`),
    state: (errors) =>
      fieldNameHasError(errors, 'local.key') ? 'error' : 'none',
    description:
      'A 96-byte long base64-encoded string. Locally managed keys do not require additional setup, but are not recommended for production applications.',
  },
];

export const KMSProviderFields = {
  local: LocalFields,
  azure: AzureFields,
  gcp: GCPFields,
  aws: AWSFields,
  kmip: KMIPFields,
};
