import React from 'react';
import {
  FormFieldContainer,
  FilePickerDialog,
  TextInput,
  useTranslation,
} from '@mongodb-js/compass-components';

function TLSClientCertificate({
  tlsCertificateKeyFile,
  tlsCertificateKeyFilePassword,
  disabled,
  displayDatabaseConnectionUserHints = true,
  optional = true,
  updateTLSClientCertificate,
  updateTLSClientCertificatePassword,
}: {
  tlsCertificateKeyFile?: string | null;
  tlsCertificateKeyFilePassword?: string | null;
  disabled: boolean;
  displayDatabaseConnectionUserHints?: boolean;
  optional?: boolean;
  updateTLSClientCertificate: (
    newClientCertificateKeyFile: string | null
  ) => void;
  updateTLSClientCertificatePassword: (newPassword: string | null) => void;
}): React.ReactElement {
  const t = useTranslation();
  return (
    <>
      <FormFieldContainer>
        <FilePickerDialog
          description={
            displayDatabaseConnectionUserHints
              ? t('connections.form.tls.learnMore', 'Learn More')
              : undefined
          }
          disabled={disabled}
          id="tlsCertificateKeyFile"
          label={t(
            'connections.form.tls.clientCertificate',
            'Client Certificate and Key (.pem)'
          )}
          dataTestId="tlsCertificateKeyFile-input"
          link={
            displayDatabaseConnectionUserHints
              ? 'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFile'
              : undefined
          }
          values={tlsCertificateKeyFile ? [tlsCertificateKeyFile] : []}
          onChange={(files: string[]) => {
            updateTLSClientCertificate(
              files && files.length > 0 ? files[0] : null
            );
          }}
          showFileOnNewLine
          mode="open"
          optional={optional}
          optionalMessage={
            optional && displayDatabaseConnectionUserHints
              ? t(
                  'connections.form.tls.clientCertificateOptional',
                  'Optional (required with X.509 auth)'
                )
              : undefined
          }
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateTLSClientCertificatePassword(value);
          }}
          disabled={disabled}
          data-testid="tlsCertificateKeyFilePassword-input"
          id="tlsCertificateKeyFilePassword"
          label={t(
            'connections.form.tls.clientKeyPassword',
            'Client Key Password'
          )}
          type="password"
          value={tlsCertificateKeyFilePassword || ''}
          optional
        />
      </FormFieldContainer>
    </>
  );
}

export default TLSClientCertificate;
