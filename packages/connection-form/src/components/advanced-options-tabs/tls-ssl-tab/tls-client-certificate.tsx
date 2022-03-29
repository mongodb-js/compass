import React from 'react';
import { FileInput, TextInput, css } from '@mongodb-js/compass-components';

import FormFieldContainer from '../../form-field-container';

const inputFieldStyles = css({
  width: '80%',
});

function TLSClientCertificate({
  tlsCertificateKeyFile,
  tlsCertificateKeyFilePassword,
  disabled,
  updateTLSClientCertificate,
  updateTLSClientCertificatePassword,
}: {
  tlsCertificateKeyFile?: string | null;
  tlsCertificateKeyFilePassword?: string | null;
  disabled: boolean;
  updateTLSClientCertificate: (
    newClientCertificateKeyFile: string | null
  ) => void;
  updateTLSClientCertificatePassword: (newPassword: string | null) => void;
}): React.ReactElement {
  return (
    <>
      <FormFieldContainer className={inputFieldStyles}>
        <FileInput
          description={'Learn More'}
          disabled={disabled}
          id="tlsCertificateKeyFile"
          label="Client Certificate and Key (.pem)"
          dataTestId="tlsCertificateKeyFile-input"
          link={
            'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFile'
          }
          values={tlsCertificateKeyFile ? [tlsCertificateKeyFile] : []}
          onChange={(files: string[]) => {
            updateTLSClientCertificate(
              files && files.length > 0 ? files[0] : null
            );
          }}
          showFileOnNewLine
          optional
          optionalMessage="Optional (required with X.509 auth)"
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
          optional
        />
      </FormFieldContainer>
    </>
  );
}

export default TLSClientCertificate;
