import React from 'react';
import { FormFieldContainer, TextInput } from '@mongodb-js/compass-components';

import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';

export const AWS_ACCESS_KEY_ID_LABEL = 'AWS Access Key Id';
export const AWS_SECRET_ACCESS_KEY_LABEL = 'AWS Secret Access Key';
export const AWS_SESSION_TOKEN_LABEL = 'AWS Session Token';

function AuthenticationAWS({
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const awsAccessKeyId = getConnectionStringUsername(connectionStringUrl);
  const awsSecretAccessKey = getConnectionStringPassword(connectionStringUrl);
  const authMechanismProperties =
    parseAuthMechanismProperties(connectionStringUrl);
  const sessionToken = authMechanismProperties.get('AWS_SESSION_TOKEN');

  return (
    <>
      <FormFieldContainer>
        <TextInput
          data-testid="connection-form-aws-access-key-id-input"
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-username',
              username: value,
            });
          }}
          label={AWS_ACCESS_KEY_ID_LABEL}
          value={awsAccessKeyId || ''}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          data-testid="connection-form-aws-secret-access-key-input"
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-password',
              password: value,
            });
          }}
          label={AWS_SECRET_ACCESS_KEY_LABEL}
          type="password"
          value={awsSecretAccessKey || ''}
          optional={true}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
          data-testid="connection-form-aws-secret-token-input"
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-auth-mechanism-property',
              key: 'AWS_SESSION_TOKEN',
              value: value,
            });
          }}
          label={AWS_SESSION_TOKEN_LABEL}
          value={sessionToken || ''}
          optional={true}
          type="password"
        />
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationAWS;
