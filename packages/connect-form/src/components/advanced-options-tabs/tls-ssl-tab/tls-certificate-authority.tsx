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
  width: '50%',
});

const removeFileButtonStyles = css({
  marginLeft: spacing[1],
});

function TLSCertificateAuthority({
  connectionStringUrl,
  disabled,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const [caFile, setCAFile] = useState<string | undefined>(undefined);

  const onChangeTLSOption = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-tls-option',
        tlsOption: event.target.value as TLS_OPTIONS,
      });
    },
    [updateConnectionFormField]
  );

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
        // id={name}
        // dataTestId={name}
        onChange={(files: string[] | null) => {
          setCAFile(
            (files && files.length > 0)
              ? files[0]
              : undefined
          );
          // formFieldChanged(name as IdentityFormKeys, files[0]);
        }}
        // values={caFile}
      />
      {caFile && (
        <div>
          {caFile}
          <IconButton
            className={removeFileButtonStyles}
            aria-label="Remove CA file"
            onClick={() => setCAFile(undefined)  }
          >
            <Icon glyph="X" />
          </IconButton>
        </div>
      )}
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
