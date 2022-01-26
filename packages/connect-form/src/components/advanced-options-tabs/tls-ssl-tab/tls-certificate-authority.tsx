import React from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';

import { useUiKitContext } from '../../../contexts/ui-kit-context';

function TLSCertificateAuthority({
  connectionStringUrl,
  disabled,
  updateCAFile,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateCAFile: (newCAFile: string | null) => void;
}): React.ReactElement {
  const { css, FileInput } = useUiKitContext();

  const caFieldsContainer = css({
    width: '80%',
  });

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
