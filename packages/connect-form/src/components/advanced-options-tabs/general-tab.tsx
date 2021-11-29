import React from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './general/schema-input';
import {
  ConnectFormFields,
  SetConnectionField,
} from '../../hooks/use-connect-form';
import FormFieldContainer from '../form-field-container';
import HostInput from './general/host-input';
import DirectConnectionInput from './general/direct-connection-input';

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
          connectionStringUrl={connectionStringUrl}
          setConnectionField={setConnectionField}
          setConnectionStringUrl={setConnectionStringUrl}
        />
      </FormFieldContainer>

      {!isSRV && hosts.value.length === 1 && (
        <FormFieldContainer>
          <DirectConnectionInput
            connectionStringUrl={connectionStringUrl}
            setConnectionStringUrl={setConnectionStringUrl}
          />
        </FormFieldContainer>
      )}
    </div>
  );
}

export default GeneralTab;
