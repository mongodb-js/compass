import React, { useCallback } from 'react';
import type {
  AutoEncryptionOptions,
  ClientEncryptionTlsOptions,
} from 'mongodb';

import TLSCertificateAuthority from '../tls-ssl-tab/tls-certificate-authority';
import TLSClientCertificate from '../tls-ssl-tab/tls-client-certificate';
import type {
  KMSTLSProviderName,
  KMSTLSProviderType,
} from '../../../utils/csfle-kms-fields';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

function KMSTLSOptions<T extends KMSTLSProviderType>({
  updateConnectionFormField,
  autoEncryptionOptions,
  kmsProviderName,
  clientCertIsOptional,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  autoEncryptionOptions: AutoEncryptionOptions;
  kmsProviderName: KMSTLSProviderName<T>;
  clientCertIsOptional?: boolean;
}): React.ReactElement {
  const currentOptions: ClientEncryptionTlsOptions =
    autoEncryptionOptions.tlsOptions?.[kmsProviderName] ?? {};

  const handleFieldChanged = useCallback(
    (key: keyof ClientEncryptionTlsOptions, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-tls-param',
        kmsProviderName,
        key,
        value,
      });
    },
    [updateConnectionFormField, kmsProviderName]
  );

  return (
    <>
      <TLSCertificateAuthority
        tlsCAFile={currentOptions.tlsCAFile}
        disabled={false}
        handleTlsOptionChanged={(key, value) =>
          handleFieldChanged(key, value ?? undefined)
        }
        displayDatabaseConnectionUserHints={false}
      />
      {/* TODO: Update UI messages for TLS situation (e.g. drop reference to X.509 auth) */}
      <TLSClientCertificate
        tlsCertificateKeyFile={currentOptions.tlsCertificateKeyFile}
        tlsCertificateKeyFilePassword={
          currentOptions.tlsCertificateKeyFilePassword
        }
        disabled={false}
        updateTLSClientCertificate={(newCertificatePath: string | null) => {
          handleFieldChanged(
            'tlsCertificateKeyFile',
            newCertificatePath ?? undefined
          );
        }}
        updateTLSClientCertificatePassword={(newPassword: string | null) => {
          handleFieldChanged(
            'tlsCertificateKeyFilePassword',
            newPassword ?? undefined
          );
        }}
        displayDatabaseConnectionUserHints={false}
        optional={clientCertIsOptional ?? true}
      />
    </>
  );
}

export default KMSTLSOptions;
