import React from 'react';
import {
  FormFieldContainer,
  FilePickerDialog,
} from '@mongodb-js/compass-components';

function TLSCertificateAuthority({
  tlsCAFile,
  disabled,
  displayDatabaseConnectionUserHints = true,
  handleTlsOptionChanged,
}: {
  tlsCAFile?: string | null;
  disabled: boolean;
  displayDatabaseConnectionUserHints?: boolean;
  handleTlsOptionChanged: (key: 'tlsCAFile', value: string | null) => void;
}): React.ReactElement {
  return (
    <>
      <FormFieldContainer>
        <FilePickerDialog
          description={
            displayDatabaseConnectionUserHints ? 'Learn More' : undefined
          }
          disabled={disabled}
          id="tlsCAFile"
          dataTestId="tlsCAFile-input"
          label="Certificate Authority (.pem)"
          link={
            displayDatabaseConnectionUserHints
              ? 'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCAFile'
              : undefined
          }
          mode="open"
          onChange={(files: string[] | null) => {
            handleTlsOptionChanged('tlsCAFile', files?.[0] ?? null);
          }}
          showFileOnNewLine
          values={tlsCAFile ? [tlsCAFile] : undefined}
          optional
        />
      </FormFieldContainer>
    </>
  );
}

export default TLSCertificateAuthority;
