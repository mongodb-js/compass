import React from 'react';
import {
  Select,
  Option,
  TextInput,
  Label,
} from '@mongodb-js/compass-components';

import type ConnectionStringUrl from 'mongodb-connection-string-url';
import util from 'util';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';
import {
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';

const GSSAPI_PRINCIPAL_NAME_LABEL = 'Principal';
const GSSAPI_SERVICE_NAME_LABEL = 'Service Name';
const GSSAPI_CANONICALIZE_HOST_NAME_LABEL = 'Canonicalize Host Name';
const GSSAPI_SERVICE_REALM_LABEL = 'Service Realm';

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

  const GSSAPI_CANONICALIZE_HOST_NAME_OPTIONS: Record<string, string> = {
    None: 'none',
    Forward: 'forward',
    'Forward and reverse': 'forwardAndReverse',
  };

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
        <Label
          id="canonicalize-hostname-label"
          htmlFor="canonicalize-hostname-select"
        >
          {GSSAPI_CANONICALIZE_HOST_NAME_LABEL}
        </Label>
        <Select
          name="name"
          placeholder="Select ..."
          id="canonicalize-hostname-select"
          aria-labelledby="canonicalize-hostname-label"
          onChange={(name): void => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'CANONICALIZE_HOST_NAME',
              value: name,
            });
          }}
          allowDeselect={true}
          value={canonicalizeHostname}
        >
          {Object.entries(GSSAPI_CANONICALIZE_HOST_NAME_OPTIONS).map(
            ([label, value]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            )
          )}
        </Select>
      </FormFieldContainer>
      <br />
      <pre>
        value=<b>{util.inspect(canonicalizeHostname)}</b>
      </pre>

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
