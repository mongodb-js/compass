import React from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './schema-input';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import HostInput from './host-input';
import { ConnectionFormError } from '../../../utils/validation';

function GeneralTab({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  return (
    <div>
      <FormFieldContainer>
        <SchemaInput
          errors={errors}
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
