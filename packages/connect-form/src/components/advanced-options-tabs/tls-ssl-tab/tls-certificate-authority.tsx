import { css } from '@emotion/css';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Checkbox,
  Description,
  FileInput,
  Icon,
  IconButton,
  Label,
  RadioBox,
  RadioBoxGroup,
  Radio,
  RadioGroup,
  TextInput,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import { TLS_OPTIONS } from '../../../constants/ssl-tls-options';

const caFieldsContainer = css({
  marginLeft: spacing[3],
});

enum TLS_CA_OPTIONS {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM'
}

function TLSCertificateAuthority({
  connectionStringUrl,
  disabled,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const [ useCustomCA, setUseCustomCA ] = useState(
    connectionStringUrl.searchParams.get('tlsCAFile') !== null
  );

  const onChangeTLSOption = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-tls-option',
        tlsOption: event.target.value as TLS_OPTIONS,
      });
    },
    [updateConnectionFormField]
  );

  const caFileOptionsDisabled = useMemo(
    () => disabled || !useCustomCA, [disabled, useCustomCA]
  );

  return (
    <FormFieldContainer>
      <RadioGroup
        // variant="default"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setUseCustomCA(event.target.value === TLS_CA_OPTIONS.CUSTOM)
        }}
        value={useCustomCA ? TLS_CA_OPTIONS.CUSTOM : TLS_CA_OPTIONS.DEFAULT}
      >
        <Radio
          value={TLS_CA_OPTIONS.DEFAULT}
          disabled={disabled}
        >
          Accept any server TLS/SSL certificates
        </Radio>
        <Radio
          value={TLS_CA_OPTIONS.CUSTOM}
          disabled={disabled}
        >
          Use own root certificate from the Certificate Authority
        </Radio>
      </RadioGroup>
      <div
        className={caFieldsContainer}
      >
        <FileInput
          description={'Learn More'}
          disabled={caFileOptionsDisabled}
          id="tlsCAFile"
          label="Certificate Authority (.pem)"
          link={'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCAFile'}
          // id={name}
          // dataTestId={name}
          onChange={(files: string[]) => {
            alert(`selected ${files.join(',')}`);
            // formFieldChanged(name as IdentityFormKeys, files[0]);
          }}
          // label={label}
          // error={Boolean(errorMessage)}
          // errorMessage={errorMessage}
          // values={value as string[] | undefined}
          // description={'Learn More'}
          // link={'https://mongodb.com'}
        />
      </div>
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
