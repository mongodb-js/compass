import React, { useEffect, useState } from 'react';
import {
  FormFieldContainer,
  Label,
  TextInput,
  RadioBoxGroup,
  RadioBox,
  Checkbox,
} from '@mongodb-js/compass-components';

import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';
import { useConnectionFormPreference } from '../../../hooks/use-connect-form-preferences';

const GSSAPI_CANONICALIZE_HOST_NAME_OPTIONS: Record<
  string,
  { label: string; value: string }
> = {
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
    authMechanismProperties.get('CANONICALIZE_HOST_NAME') || 'none';

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const showKerberosPasswordField = !!useConnectionFormPreference(
    'showKerberosPasswordField'
  );

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
          data-testid="gssapi-principal-input"
          label="Principal"
          errorMessage={kerberosPrincipalError}
          state={kerberosPrincipalError ? 'error' : undefined}
          value={principal || ''}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
          data-testid="gssapi-service-name-input"
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
          label="Service Name"
          value={serviceName || ''}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <Label htmlFor="canonicalize-hostname-select">
          Canonicalize Host Name
        </Label>
        <RadioBoxGroup
          name="canonicalize-hostname"
          id="canonicalize-hostname-select"
          onChange={({ target: { value } }): void => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'CANONICALIZE_HOST_NAME',
              value: value === 'none' ? '' : value,
            });
          }}
          value={canonicalizeHostname}
          size="compact"
        >
          {Object.entries(GSSAPI_CANONICALIZE_HOST_NAME_OPTIONS).map(
            ([key, { label, value }]) => (
              <RadioBox
                id={`gssapi-canonicalize-host-name-${key}`}
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
          data-testid="gssapi-service-realm-input"
          label="Service Realm"
          value={serviceRealm || ''}
          optional
        />
      </FormFieldContainer>
      {showKerberosPasswordField && (
        <>
          <FormFieldContainer>
            <Checkbox
              data-testid="gssapi-password-checkbox"
              checked={showPassword}
              label="Provide password directly"
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
          </FormFieldContainer>
          {showPassword && (
            <FormFieldContainer>
              <TextInput
                onChange={({
                  target: { value },
                }: React.ChangeEvent<HTMLInputElement>) => {
                  updateConnectionFormField({
                    type: 'update-password',
                    password: value,
                  });
                }}
                data-testid="gssapi-password-input"
                label="Password"
                value={password}
                type="password"
                optional
              />
            </FormFieldContainer>
          )}
        </>
      )}
    </>
  );
}

export default AuthenticationGSSAPI;
