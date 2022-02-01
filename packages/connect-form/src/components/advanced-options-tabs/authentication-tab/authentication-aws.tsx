import React from 'react';
import { TextInput } from '@mongodb-js/compass-components';

import ConnectionStringUrl from 'mongodb-connection-string-url';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import { ConnectionFormError } from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';

export const AWS_ACCESS_KEY_ID_LABEL = 'Aws Access Key Id';
export const AWS_SECRET_ACCESS_KEY_LABEL = 'Aws Secret Access Key';
export const AWS_SESSION_TOKEN_LABEL = 'Aws Session Token';

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
          optional={true}
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
          label={AWS_SECRET_ACCESS_KEY_LABEL}
          type="password"
          value={awsSecretAccessKey || ''}
          optional={true}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
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
