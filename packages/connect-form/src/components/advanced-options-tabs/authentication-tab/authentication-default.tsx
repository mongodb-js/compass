import React, { useCallback } from 'react';
import {
  Icon,
  IconButton,
  Label,
  RadioBox,
  RadioBoxGroup,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { AuthMechanism } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import {
  ConnectionFormError,
  errorMessageByFieldName,
} from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
} from '../../../utils/connection-string-helpers';

const authSourceLabelStyles = css({
  padding: 0,
  margin: 0,
  flexGrow: 1,
});

const infoButtonStyles = css({
  verticalAlign: 'middle',
  marginTop: -spacing[1],
});

const defaultAuthMechanismOptions: {
  title: string;
  value: AuthMechanism;
}[] = [
  {
    title: 'Default',
    value: AuthMechanism.MONGODB_DEFAULT,
  },
  {
    title: 'SCRAM-SHA-1',
    value: AuthMechanism.MONGODB_SCRAM_SHA1,
  },
  {
    title: 'SCRAM-SHA-256',
    value: AuthMechanism.MONGODB_SCRAM_SHA256,
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
          errorMessage={usernameError}
          state={usernameError ? 'error' : undefined}
          value={username || ''}
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
          value={password || ''}
          errorMessage={passwordError}
          state={passwordError ? 'error' : undefined}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label
          className={authSourceLabelStyles}
          htmlFor="authSourceInput"
          id="authSourceLabel"
        >
          Authentication Database
          <IconButton
            className={infoButtonStyles}
            aria-label="Authentication Database Documentation"
            href="https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.authSource"
            target="_blank"
          >
            <Icon glyph="InfoWithCircle" size="small" />
          </IconButton>
        </Label>

        <TextInput
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
          size="default"
          value={selectedAuthTab.value}
        >
          {defaultAuthMechanismOptions.map(({ title, value }) => {
            return (
              <RadioBox
                data-testid={`${value}-tab-button`}
                checked={selectedAuthTab.value === value}
                value={value}
                key={value}
                size="default"
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
