import React from 'react';
import {
  Checkbox,
  Description,
  Label,
  FileInput,
  css,
  cx,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';
import {
  checkboxDescriptionStyles,
  disabledCheckboxDescriptionStyles,
} from './tls-ssl-tab';

import FormFieldContainer from '../../form-field-container';

const caFieldsContainer = css({
  width: '80%',
});

function TLSCertificateAuthority({
  connectionStringUrl,
  useSystemCA,
  disabled,
  updateCAFile,
}: {
  connectionStringUrl: ConnectionStringUrl;
  useSystemCA: boolean;
  disabled: boolean;
  updateCAFile: (newCAFile: string | null, useSystemCA: boolean) => void;
}): React.ReactElement {
  const caFile = connectionStringUrl
    .typedSearchParams<MongoClientOptions>()
    .get('tlsCAFile');

  return (
    <FormFieldContainer className={caFieldsContainer}>
      <FileInput
        description={'Learn More'}
        disabled={disabled || useSystemCA}
        id="tlsCAFile"
        dataTestId="tlsCAFile-input"
        label="Certificate Authority (.pem)"
        link={
          'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCAFile'
        }
        onChange={(files: string[] | null) => {
          updateCAFile(files && files.length > 0 ? files[0] : null, false);
        }}
        showFileOnNewLine
        values={caFile ? [caFile] : undefined}
        optional
      />
      <Checkbox
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          updateCAFile(null, event.target.checked);
        }}
        data-testid="useSystemCA-input"
        id="useSystemCA-input"
        label={
          <>
            <Label htmlFor="useSystemCA-input">
              Use System Certificate Authority
            </Label>
            <Description
              className={cx(checkboxDescriptionStyles, {
                [disabledCheckboxDescriptionStyles]: disabled,
              })}
            >
              Use the operating system’s Certificate Authority store.
            </Description>
          </>
        }
        disabled={disabled}
        checked={useSystemCA}
        bold={false}
      />
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
