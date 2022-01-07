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
  // display: 'flex',
  // flexDirection: 'row',
  // alignItems: 'center',
  width: '50%',
});

// const caFileInputContainer = css({
//   flexGrow: 1
// });

// const removeFileButtonStyles = css({
//   marginLeft: spacing[1],
//   marginTop: spacing[1],
// });

function TLSCertificateAuthority({
  connectionStringUrl,
  disabled,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  disabled: boolean;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const [caFile, setCAFile] = useState<string[] | undefined>(undefined);
  const [useCustomCA, setUseCustomCA] = useState(
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

  return (
    <FormFieldContainer className={caFieldsContainer}>
      {/* <div
        className={caFieldsContainer}
      > */}
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
        onChange={(files: string[]) => {
          setCAFile(files);
          // formFieldChanged(name as IdentityFormKeys, files[0]);
        }}
        values={caFile}
      />
      {/* </div> */}
      {/* {caFile && (
          <IconButton
            className={removeFileButtonStyles}
            aria-label="Remove CA file"
            onClick={() => setCAFile(undefined)  }
          >
            <Icon glyph="Minus" />
          </IconButton>
        )} */}
      {/* </div> */}
    </FormFieldContainer>
  );
}

export default TLSCertificateAuthority;
