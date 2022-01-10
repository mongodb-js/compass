import { css } from '@emotion/css';
import React from 'react';
import {
  FileInput,
  Icon,
  IconButton,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MongoClientOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';

const caFieldsContainer = css({
  width: '70%',
});

const removeFileButtonStyles = css({
  marginLeft: spacing[1],
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
        label="Certificate Authority (.pem)"
        link={
          'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCAFile'
        }
        onChange={(files: string[] | null) => {
          updateCAFile(files && files.length > 0 ? files[0] : null);
        }}
        // values={caFile}
      />
      {caFile && (
        <div>
          {caFile}
          <IconButton
            className={removeFileButtonStyles}
            aria-label="Remove CA file"
            onClick={() => {
              updateCAFile(null);
            }}
          >
            <Icon glyph="X" />
          </IconButton>
        </div>
      )}
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
