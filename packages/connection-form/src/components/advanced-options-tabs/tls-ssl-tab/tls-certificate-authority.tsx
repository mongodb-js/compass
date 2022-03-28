import React from 'react';
import {
  Checkbox,
  Description,
  Label,
  FileInput,
  css,
  cx,
} from '@mongodb-js/compass-components';
import {
  checkboxDescriptionStyles,
  disabledCheckboxDescriptionStyles,
} from './tls-ssl-tab';

import FormFieldContainer from '../../form-field-container';

const caFieldsContainer = css({
  width: '80%',
});

function TLSCertificateAuthority({
  tlsCAFile,
  useSystemCA,
  disabled,
  handleTlsOptionChanged,
}: {
  tlsCAFile?: string | null;
  useSystemCA: boolean;
  disabled: boolean;
  handleTlsOptionChanged: (
    key: 'tlsCAFile' | 'useSystemCA',
    value: string | null
  ) => void;
}): React.ReactElement {
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
          handleTlsOptionChanged('tlsCAFile', files?.[0] ?? null);
        }}
        showFileOnNewLine
        values={tlsCAFile ? [tlsCAFile] : undefined}
        optional
      />
      <Checkbox
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          handleTlsOptionChanged(
            'useSystemCA',
            event.target.checked ? 'true' : null
          );
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
      />
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
