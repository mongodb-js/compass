import React from 'react';
import { Checkbox, TextInput } from '@mongodb-js/compass-components';

import ConnectionStringUrl from 'mongodb-connection-string-url';
import {
  parseAuthMechanismProperties,
  UpdateConnectionFormField,
} from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import {
  ConnectionFormError,
  errorMessageByFieldName,
} from '../../../utils/validation';

function AuthenticationGSSAPI({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const kerberosPrincipalError = errorMessageByFieldName(
    errors,
    'kerberosPrincipal'
  );
  const principal = decodeURIComponent(connectionStringUrl.username);
  const authMechanismProperties =
    parseAuthMechanismProperties(connectionStringUrl);
  const serviceName = authMechanismProperties.get('SERVICE_NAME');
  const serviceRealm = authMechanismProperties.get('SERVICE_REALM');
  const canonicalizeHostname = authMechanismProperties.get(
    'CANONICALIZE_HOST_NAME'
  );

  return (
    <>
      <FormFieldContainer>
        <TextInput
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-username',
              username: value,
            });
          }}
          label="Principal"
          errorMessage={kerberosPrincipalError}
          state={kerberosPrincipalError ? 'error' : undefined}
          value={principal || ''}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'SERVICE_NAME',
              value: value,
            });
          }}
          label="Service Name"
          value={serviceName || ''}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <Checkbox
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'CANONICALIZE_HOST_NAME',
              value: event.target.checked ? 'true' : '',
            });
          }}
          label="Canonicalize Host Name"
          checked={canonicalizeHostname === 'true'}
          bold={false}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'SERVICE_REALM',
              value: value,
            });
          }}
          label="Service Realm"
          value={serviceRealm || ''}
        />
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationGSSAPI;
