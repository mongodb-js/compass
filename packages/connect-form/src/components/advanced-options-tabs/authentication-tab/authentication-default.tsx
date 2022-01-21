import React, { useCallback, useEffect } from 'react';
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
import { ConnectionFormError } from '../../../utils/validation';

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
    title: 'SCRAM-SHA-1',
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
  const password = connectionStringUrl.password;
  const username = connectionStringUrl.username;
  // const [username, setUsername] = useState(connectionStringUrl.username);
  // const [usernameErrorMessage, usernameErrorMessage]

  const selectedAuthMechanism =
    connectionStringUrl.searchParams.get('authMechanism') ?? '';
  const selectedAuthTab =
    defaultAuthMechanismOptions.find(
      ({ value }) => value === selectedAuthMechanism
    ) ?? defaultAuthMechanismOptions[0];

  // useEffect(() => {
  //   // Update the username in the state when the underlying connection username
  //   // changes. This can be when a user changes connections, pastes in a new
  //   // connection string, or changes a setting which also updates the username.
  //   setUsername(connectionStringUrl.username);
  // }, [connectionStringUrl]);

  const optionSelected = useCallback(
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
          // disabled={disabled}
          label="Username"
          errorMessage={
            errors?.find((error) => error.fieldName === 'username')?.message
          }
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
          // disabled={disabled}
          label="Password"
          type="password"
          value={password || ''}
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
            // data-testid="connectionStringDocsButton"
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
          // disabled={disabled}
          id="authSourceInput"
          aria-labelledby="authSourceLabel"
          // label="Authentication Database"
          value={connectionStringUrl.searchParams.get('authSource') ?? ''}
          optional
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="authentication-mechanism-radio-box-group">
          Authentication Mechanism
        </Label>
        <RadioBoxGroup
          onChange={optionSelected}
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
