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
  TextInput,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import { TLS_OPTIONS } from '../../../constants/ssl-tls-options';

const clientCertificateFieldsContainer = css({
  marginLeft: spacing[3],
});

function TLSClientCertificate({
  connectionStringUrl,
  disabled,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const [ useClientCert, setUseClientCert ] = useState(
    connectionStringUrl.searchParams.get('tlsCertificateKeyFile') !== null
  );
  // TODO: Override when underlying connection changes?

  const clientCertificateOptionsDisabled = useMemo(
    () => disabled || !useClientCert, [disabled, useClientCert]
  );

  return (
    <FormFieldContainer>
      <Checkbox
        disabled={disabled}
        label="Use Client Certificate"
        // description={'Learn More'}
        // link={'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFile'}
        checked={useClientCert}
        // TODO: Unset and set tlsCertificateKeyFile.
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUseClientCert(event.target.checked)}
        // id={name}
        // dataTestId={name}
        // onChange={(files: string[]) => {
        //   formFieldChanged(name as IdentityFormKeys, files[0]);
        // }}
        // label={label}
        // error={Boolean(errorMessage)}
        // errorMessage={errorMessage}
        // values={value as string[] | undefined}
        // description={'Learn More'}
        // link={'https://mongodb.com'}
      />
      <div className={clientCertificateFieldsContainer}>
        <FormFieldContainer>
          <FileInput
            description={'Learn More'}
            disabled={clientCertificateOptionsDisabled}
            id="tlsCertificateKeyFile"
            label="Client Certificate (.pem)"
            link={'https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFile'}
            // id={name}
            // dataTestId={name}
            onChange={(files: string[]) => {
              alert(`client cert change ${files.join(',')}`)
              // formFieldChanged(name as IdentityFormKeys, files[0]);
            }}
            // label={label}
            // error={Boolean(errorMessage)}
            // errorMessage={errorMessage}
            // values={value as string[] | undefined}
            // description={'Learn More'}
            // link={'https://mongodb.com'}
          />
        </FormFieldContainer>
        <FormFieldContainer>
          <TextInput
            // onChange={({
            //   target: { value },
            // }: React.ChangeEvent<HTMLInputElement>) => {
            //   formFieldChanged(
            //     name as IdentityFormKeys,
            //     name === 'port' ? Number(value) : value
            //   );
            // }}
            disabled={clientCertificateOptionsDisabled}
            label="Client Key Password"
            // https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFilePassword
            type="password"
            value={connectionStringUrl.searchParams.get('tlsCertificateKeyFilePassword') || ''}
            // value={}
            // errorMessage={errorMessage}
            // state={state as 'error' | 'none'}
          />
        </FormFieldContainer>
      </div>
    </FormFieldContainer>
  );
}

export default TLSClientCertificate;
