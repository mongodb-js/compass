import React from 'react';
import { Checkbox, TextInput } from '@mongodb-js/compass-components';

import ConnectionStringUrl from 'mongodb-connection-string-url';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import {
  ConnectionFormError,
  errorMessageByFieldName,
} from '../../../utils/validation';
import {
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';

export const GSSAPI_PRINCIPAL_NAME_LABEL = 'Principal';
export const GSSAPI_SERVICE_NAME_LABEL = 'Service Name';
export const GSSAPI_CANONICALIZE_HOST_NAME_LABEL = 'Canonicalize Host Name';
export const GSSAPI_SERVICE_REALM_LABEL = 'Service Realm';

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
  const principal = getConnectionStringUsername(connectionStringUrl);
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
          label={GSSAPI_PRINCIPAL_NAME_LABEL}
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
          label={GSSAPI_SERVICE_NAME_LABEL}
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
          label={GSSAPI_CANONICALIZE_HOST_NAME_LABEL}
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
          label={GSSAPI_SERVICE_REALM_LABEL}
          value={serviceRealm || ''}
        />
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationGSSAPI;
