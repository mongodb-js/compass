import React from 'react';
import { FileInput, TextInput, css } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MongoClientOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';

const inputFieldStyles = css({
  width: '70%',
});

function TLSClientCertificate({
  connectionStringUrl,
  disabled,
  updateTLSClientCertificate,
  updateTLSClientCertificatePassword,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateTLSClientCertificate: (
    newClientCertificateKeyFile: string | null
  ) => void;
  updateTLSClientCertificatePassword: (newPassword: string | null) => void;
}): React.ReactElement {
  const typedParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  const clientCertificateKeyFile = typedParams.get('tlsCertificateKeyFile');
  const tlsCertificateKeyFilePassword = typedParams.get(
    'tlsCertificateKeyFilePassword'
  );

  return (
    <>
      <FormFieldContainer className={inputFieldStyles}>
        <FileInput
          description={'Learn More'}
          disabled={disabled}
          id="tlsCertificateKeyFile"
          label="Client Certificate (.pem)"
          dataTestId="tlsCertificateKeyFile-input"
          link={
            'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFile'
          }
          values={clientCertificateKeyFile ? [clientCertificateKeyFile] : []}
          onChange={(files: string[]) => {
            updateTLSClientCertificate(
              files && files.length > 0 ? files[0] : null
            );
          }}
          showFileOnNewLine
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          className={inputFieldStyles}
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateTLSClientCertificatePassword(value);
          }}
          disabled={disabled}
          data-testid="tlsCertificateKeyFilePassword-input"
          id="tlsCertificateKeyFilePassword"
          label="Client Key Password"
          type="password"
          value={tlsCertificateKeyFilePassword || ''}
        />
      </FormFieldContainer>
    </>
  );
}

export default TLSClientCertificate;
