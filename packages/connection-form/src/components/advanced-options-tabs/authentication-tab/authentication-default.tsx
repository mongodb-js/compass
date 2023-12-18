import React, { useCallback } from 'react';
import {
  FormFieldContainer,
  InlineInfoLink,
  Label,
  RadioBox,
  RadioBoxGroup,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { AuthMechanism } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
} from '../../../utils/connection-string-helpers';

const textInputWithLabelStyles = css({
  marginTop: spacing[1],
});

const defaultAuthMechanismOptions: {
  title: string;
  value: AuthMechanism;
}[] = [
  {
    title: 'Default',
    value: 'DEFAULT',
  },
  {
    title: 'SCRAM-SHA-1',
    value: 'SCRAM-SHA-1',
  },
  {
    title: 'SCRAM-SHA-256',
    value: 'SCRAM-SHA-256',
  },
];

function AuthenticationDefault({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const password = getConnectionStringPassword(connectionStringUrl);
  const username = getConnectionStringUsername(connectionStringUrl);

  const selectedAuthMechanism = (
    connectionStringUrl.searchParams.get('authMechanism') ?? ''
  ).toUpperCase();
  const selectedAuthTab =
    defaultAuthMechanismOptions.find(
      ({ value }) => value === selectedAuthMechanism
    ) ?? defaultAuthMechanismOptions[0];

  const onAuthMechanismSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      updateConnectionFormField({
        type: 'update-search-param',
        currentKey: 'authMechanism',
        value: event.target.value,
      });
    },
    [updateConnectionFormField]
  );

  const usernameError = errorMessageByFieldName(errors, 'username');
  const passwordError = errorMessageByFieldName(errors, 'password');

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
          label="Username"
          data-testid="connection-username-input"
          errorMessage={usernameError}
          state={usernameError ? 'error' : undefined}
          value={username || ''}
          optional
        />
      </FormFieldContainer>
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
          label="Password"
          type="password"
          data-testid="connection-password-input"
          value={password || ''}
          errorMessage={passwordError}
          state={passwordError ? 'error' : undefined}
          optional
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="authSourceInput" id="authSourceLabel">
          Authentication Database
        </Label>
        <InlineInfoLink
          aria-label="Authentication Database Documentation"
          href="https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.authSource"
        />
        <TextInput
          className={textInputWithLabelStyles}
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            if (value === '') {
              updateConnectionFormField({
                type: 'delete-search-param',
                key: 'authSource',
              });
              return;
            }
            updateConnectionFormField({
              type: 'update-search-param',
              currentKey: 'authSource',
              value,
            });
          }}
          id="authSourceInput"
          aria-labelledby="authSourceLabel"
          value={connectionStringUrl.searchParams.get('authSource') ?? ''}
          optional
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="authentication-mechanism-radio-box-group">
          Authentication Mechanism
        </Label>
        <RadioBoxGroup
          onChange={onAuthMechanismSelected}
          id="authentication-mechanism-radio-box-group"
          value={selectedAuthTab.value}
        >
          {defaultAuthMechanismOptions.map(({ title, value }) => {
            return (
              <RadioBox
                id={`${value}-tab-button`}
                data-testid={`${value}-tab-button`}
                checked={selectedAuthTab.value === value}
                value={value}
                key={value}
              >
                {title}
              </RadioBox>
            );
          })}
        </RadioBoxGroup>
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationDefault;
