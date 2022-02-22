import React from 'react';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemeInput from './scheme-input';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import HostInput from './host-input';
import type { ConnectionFormError } from '../../../utils/validation';

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
        <SchemeInput
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
