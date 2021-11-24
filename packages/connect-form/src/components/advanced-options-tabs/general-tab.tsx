import React from 'react';
import { Checkbox, Description } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './general/schema-input';
import {
  ConnectFormFields,
  SetConnectionField,
} from '../../hooks/use-connect-form';
import FormFieldContainer from '../form-field-container';
import HostInput from './general/host-input';

function GeneralTab({
  fields,
  connectionStringUrl,
  setConnectionField,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  fields: ConnectFormFields;
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  const directConnection =
    connectionStringUrl.searchParams.get('directConnection') === 'true';

  const { hosts } = fields;

  return (
    <div>
      <FormFieldContainer>
        <SchemaInput
          connectionStringUrl={connectionStringUrl}
          setConnectionStringUrl={setConnectionStringUrl}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <HostInput
          hosts={hosts}
          isSRV={isSRV}
          connectionStringUrl={connectionStringUrl}
          setConnectionField={setConnectionField}
          setConnectionStringUrl={setConnectionStringUrl}
        />
      </FormFieldContainer>

      {!isSRV && hosts.value.length === 1 && (
        <FormFieldContainer>
          <Checkbox
            onChange={(event) => {
              const updatedConnectionString = connectionStringUrl.clone();
              if (event.target.checked) {
                updatedConnectionString.searchParams.set(
                  'directConnection',
                  'true'
                );
              } else if (
                updatedConnectionString.searchParams.get('directConnection')
              ) {
                updatedConnectionString.searchParams.delete('directConnection');
              }

              setConnectionStringUrl(updatedConnectionString);
            }}
            label="Direct Connection"
            checked={directConnection}
            bold={false}
          />
          <Description>
            Specifies whether to force dispatch all operations to the specified
            host.
          </Description>
        </FormFieldContainer>
      )}
    </div>
  );
}

export default GeneralTab;
