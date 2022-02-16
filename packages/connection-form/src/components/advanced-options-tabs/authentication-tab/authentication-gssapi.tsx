import React, { useEffect, useState } from 'react';
import {
  TextInput,
  Label,
  RadioBoxGroup,
  RadioBox,
  Checkbox,
} from '@mongodb-js/compass-components';

import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';

export const GSSAPI_PRINCIPAL_NAME_LABEL = 'Principal';
export const GSSAPI_SERVICE_NAME_LABEL = 'Service Name';
export const GSSAPI_CANONICALIZE_HOST_NAME_LABEL = 'Canonicalize Host Name';
export const GSSAPI_SERVICE_REALM_LABEL = 'Service Realm';
export const GSSAPI_SHOW_PASSWORD_LABEL = 'Provide password directly';
export const GSSAPI_PASSWORD_LABEL = 'Password';
export const GSSAPI_CANONICALIZE_HOST_NAME_OPTIONS: Record<
  string,
  { label: string; value: string }
> = {
  default: { label: 'Default', value: '' },
  none: { label: 'None', value: 'none' },
  forward: { label: 'Forward', value: 'forward' },
  forwardAndReverse: {
    label: 'Forward and reverse',
    value: 'forwardAndReverse',
  },
};

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
  const password = getConnectionStringPassword(connectionStringUrl);

  const authMechanismProperties =
    parseAuthMechanismProperties(connectionStringUrl);
  const serviceName = authMechanismProperties.get('SERVICE_NAME');
  const serviceRealm = authMechanismProperties.get('SERVICE_REALM');
  const canonicalizeHostname =
    authMechanismProperties.get('CANONICALIZE_HOST_NAME') || '';

  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (!showPassword && password.length) {
      setShowPassword(true);
    }
  }, [password, showPassword, updateConnectionFormField]);

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
          optional
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
        <RadioBoxGroup
          name="canonicalize-hostname"
          id="canonicalize-hostname-select"
          aria-labelledby="canonicalize-hostname-label"
          onChange={(event): void => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'CANONICALIZE_HOST_NAME',
              value: event.target.value,
            });
          }}
          value={canonicalizeHostname}
        >
          {Object.entries(GSSAPI_CANONICALIZE_HOST_NAME_OPTIONS).map(
            ([key, { label, value }]) => (
              <RadioBox
                data-testid={`gssapi-canonicalize-host-name-${key}`}
                key={value}
                value={value}
              >
                {label}
              </RadioBox>
            )
          )}
        </RadioBoxGroup>
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
          optional
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Checkbox
          checked={showPassword}
          label={GSSAPI_SHOW_PASSWORD_LABEL}
          onChange={({ target: { checked } }) => {
            if (!checked) {
              updateConnectionFormField({
                type: 'update-password',
                password: '',
              });
            }

            setShowPassword(checked);
          }}
        />
        {showPassword && (
          <TextInput
            onChange={({
              target: { value },
            }: React.ChangeEvent<HTMLInputElement>) => {
              updateConnectionFormField({
                type: 'update-password',
                password: value,
              });
            }}
            label={GSSAPI_PASSWORD_LABEL}
            value={password}
            type="password"
            optional
          />
        )}
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationGSSAPI;
