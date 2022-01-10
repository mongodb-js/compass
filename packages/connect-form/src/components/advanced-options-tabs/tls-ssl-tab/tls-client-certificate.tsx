import { css } from '@emotion/css';
import React from 'react';
import { FileInput, TextInput } from '@mongodb-js/compass-components';
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
  // TODO: Override when underlying connection changes?

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
          link={
            'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFile'
          }
          values={clientCertificateKeyFile ? [clientCertificateKeyFile] : []}
          // id={name}
          // dataTestId={name}
          onChange={(files: string[]) => {
            updateTLSClientCertificate(
              files && files.length > 0 ? files[0] : null
            );
          }}
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
          id="tlsCertificateKeyFilePassword"
          label="Client Key Password"
          // https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFilePassword
          type="password"
          value={tlsCertificateKeyFilePassword || ''}
        />
      </FormFieldContainer>
    </>
  );
}

export default TLSClientCertificate;
