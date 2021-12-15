import React from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './general/schema-input';
import { UpdateConnectionFormField } from '../../hooks/use-connect-form';
import { ConnectionFormError } from '../../utils/connect-form-errors';
import FormFieldContainer from '../form-field-container';
import HostInput from './general/host-input';

function GeneralTab({
  errors,
  connectionStringUrl,
  hideError,
  updateConnectionFormField,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  hideError: (errorIndex: number) => void;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  return (
    <div>
      <FormFieldContainer>
        <SchemaInput
          errors={errors}
          hideError={hideError}
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormField}
        />
      </FormFieldContainer>
      <HostInput
        errors={errors}
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
      />
    </div>
  );
}

export default GeneralTab;
