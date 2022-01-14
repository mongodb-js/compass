import React from 'react';
import { css, FileInput } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MongoClientOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';

const caFieldsContainer = css({
  width: '70%',
});

function TLSCertificateAuthority({
  connectionStringUrl,
  disabled,
  updateCAFile,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateCAFile: (newCAFile: string | null) => void;
}): React.ReactElement {
  const caFile = connectionStringUrl
    .typedSearchParams<MongoClientOptions>()
    .get('tlsCAFile');

  return (
    <FormFieldContainer className={caFieldsContainer}>
      <FileInput
        description={'Learn More'}
        disabled={disabled}
        id="tlsCAFile"
        dataTestId="tlsCAFile-input"
        label="Certificate Authority (.pem)"
        link={
          'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCAFile'
        }
        onChange={(files: string[] | null) => {
          updateCAFile(files && files.length > 0 ? files[0] : null);
        }}
        showFileOnNewLine
        values={caFile ? [caFile] : undefined}
        optional
      />
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
