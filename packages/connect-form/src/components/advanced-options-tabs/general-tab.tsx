import React from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemaInput from './general/schema-input';
import {
  UpdateConnectionFormField
} from '../../hooks/use-connect-form';
import { ConnectionFormError, InvalidFormFieldsState } from '../../utils/connect-form-errors';
import FormFieldContainer from '../form-field-container';
import HostInput from './general/host-input';
import DirectConnectionInput from './general/direct-connection-input';

function GeneralTab({
  errors,
  invalidFields,
  connectionStringUrl,
  hideError,
  updateConnectionFormField
}: {
  errors: ConnectionFormError[],
  invalidFields: InvalidFormFieldsState | null;
  connectionStringUrl: ConnectionStringUrl;
  hideError: (errorIndex: number) => void;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const hosts = (invalidFields !== null && invalidFields.hosts)
    ? invalidFields.hosts
    : connectionStringUrl.hosts;

  const showDirectConnectionInput =
    connectionStringUrl.searchParams.get('directConnection') === 'true' ||
    (!connectionStringUrl.isSRV && hosts.length === 1);

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
      <FormFieldContainer>
        <HostInput
          errors={errors}
          hosts={hosts}
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormField}
        />
      </FormFieldContainer>
      {showDirectConnectionInput && (
        <FormFieldContainer>
          <DirectConnectionInput
            connectionStringUrl={connectionStringUrl}
            updateConnectionFormField={updateConnectionFormField}
          />
        </FormFieldContainer>
      )}
    </div>
  );
}

export default GeneralTab;
