import React from 'react';
import { css, spacing, TextInput, Toggle } from '@mongodb-js/compass-components';

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

const canonicalizeHostnameStyles = css({
  padding: 0,
  margin: 0,
  display: 'flex',
});

const canonicalizeHostnameToggleStyles = css({
  height: 14,
  width: 26,
  margin: spacing[1],
  marginRight: 0,
  marginLeft: 'auto',
});

const canonicalizeHostnameLabelStyles = css({
  '&:hover': {
    cursor: 'pointer',
  },
});

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
  const canonicalizeHostname = authMechanismProperties.get('CANONICALIZE_HOST_NAME');

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
        <div className={canonicalizeHostnameStyles}>
          <label
            className={canonicalizeHostnameLabelStyles}
            id="canonicalizeHostnameLabel"
            htmlFor="canonicalizeHostname"
          >
            Canonicalize Host Name
          </label>
          <Toggle
            id="canonicalizeHostname"
            aria-labelledby="label"
            className={canonicalizeHostnameToggleStyles}
            onChange={(checked) => {
              updateConnectionFormField({
                type: 'update-auth-mechanism-property',
                key: 'CANONICALIZE_HOST_NAME',
                value: checked ? 'true' : '',
              });
            }}
            checked={canonicalizeHostname === 'true'}
          />
        </div>
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
