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

const inputFieldStyles = css({
  width: '70%',
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
  const [useClientCert, setUseClientCert] = useState(
    connectionStringUrl.searchParams.get('tlsCertificateKeyFile') !== null
  );
  // TODO: Override when underlying connection changes?

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
          // id={name}
          // dataTestId={name}
          onChange={(files: string[]) => {
            alert(`client cert change ${files.join(',')}`);
            // formFieldChanged(name as IdentityFormKeys, files[0]);
          }}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          className={inputFieldStyles}
          // onChange={({
          //   target: { value },
          // }: React.ChangeEvent<HTMLInputElement>) => {
          //   formFieldChanged(
          //     name as IdentityFormKeys,
          //     name === 'port' ? Number(value) : value
          //   );
          // }}
          disabled={disabled}
          label="Client Key Password"
          // https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.tlsCertificateKeyFilePassword
          type="password"
          value={
            connectionStringUrl.searchParams.get(
              'tlsCertificateKeyFilePassword'
            ) || ''
          }
        />
      </FormFieldContainer>
    </>
  );
}

export default TLSClientCertificate;
