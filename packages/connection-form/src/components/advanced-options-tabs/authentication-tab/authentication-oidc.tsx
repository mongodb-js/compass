import React, { useCallback } from 'react';
import {
  Accordion,
  Checkbox,
  Description,
  FormFieldContainer,
  Label,
  TextInput,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';
import {
  getConnectionStringUsername,
  parseAuthMechanismProperties,
} from '../../../utils/connection-string-helpers';

type OIDCOptions = NonNullable<ConnectionOptions['oidc']>;

function AuthenticationOIDC({
  connectionStringUrl,
  updateConnectionFormField,
  errors,
  connectionOptions,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const username = getConnectionStringUsername(connectionStringUrl);
  const usernameError = errorMessageByFieldName(errors, 'username');

  const handleFieldChanged = useCallback(
    (key: keyof OIDCOptions, value?: OIDCOptions[keyof OIDCOptions]) => {
      return updateConnectionFormField({
        type: 'update-oidc-param',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const authMechanismProperties =
    parseAuthMechanismProperties(connectionStringUrl);
  const allowedHosts = authMechanismProperties.get('ALLOWED_HOSTS');
  const hasEnabledUntrustedEndpoints = allowedHosts === '*'; // TODO: Make this check good

  const hasEnabledDeviceAuthFlow = !!(
    connectionOptions.oidc?.allowedFlows as string[]
  )?.includes?.('device-auth');
  // '\nConsider specifying --oidcFlows=auth-code,device-auth if you are running mongosh in an environment without browser access.';

  return (
    <>
      <FormFieldContainer>
        <TextInput
          data-testid="connection-oidc-username-input"
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-username',
              username: value,
            });
          }}
          label="Principal"
          value={username || ''}
          errorMessage={usernameError}
          state={usernameError ? 'error' : undefined}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Accordion text="OIDC Options">
          <FormFieldContainer>
            <TextInput
              data-testid="connection-oidc-auth-code-flow-redirect-uri-input"
              onChange={({
                target: { value },
              }: React.ChangeEvent<HTMLInputElement>) => {
                handleFieldChanged(
                  'redirectURI', // TODO
                  value
                );
              }}
              optional
              label="Auth Code Flow Redirect URI"
              value={connectionOptions?.oidc?.redirectURI || ''}
            />
          </FormFieldContainer>

          <FormFieldContainer>
            <Checkbox
              onChange={({
                target: { checked },
              }: React.ChangeEvent<HTMLInputElement>) => {
                if (checked) {
                  updateConnectionFormField({
                    type: 'update-auth-mechanism-property',
                    key: 'ALLOWED_HOSTS',
                    value: '*',
                  });

                  return;
                }

                // Unset the allowed hosts.
                updateConnectionFormField({
                  type: 'update-auth-mechanism-property',
                  key: 'ALLOWED_HOSTS',
                  value: '',
                });
              }}
              data-testid="oidc-allow-untrusted-endpoint-input"
              id="oidc-allow-untrusted-endpoint-input"
              label={
                <>
                  <Label htmlFor="oidc-allow-untrusted-endpoint-input">
                    {/* TODO: text */}
                    Enable untrusted target endpoint
                  </Label>
                  <Description>
                    {/* TODO: text */}
                    Enable connecting even if the target endpoint is not in the
                    list of trusted endpoints &#40;this sets the driver&apos;s
                    ALLOWED_HOSTS list to *&#41;
                  </Description>
                </>
              }
              checked={hasEnabledUntrustedEndpoints}
            />
          </FormFieldContainer>

          <FormFieldContainer>
            <Checkbox
              onChange={({
                target: { checked },
              }: React.ChangeEvent<HTMLInputElement>) => {
                if (checked) {
                  handleFieldChanged('allowedFlows', ['device-auth']);

                  return;
                }

                // TODO: Should we fully unset or just the array index?
                handleFieldChanged('allowedFlows', undefined);
              }}
              data-testid="oidc-enable-device-auth-flow-input"
              id="oidc-enable-device-auth-flow-input"
              label={
                <>
                  <Label htmlFor="oidc-enable-device-auth-flow-input">
                    Enable device authentication flow
                  </Label>
                  <Description>
                    {/* TODO: text */}
                    Text
                  </Description>
                </>
              }
              checked={hasEnabledDeviceAuthFlow}
            />
          </FormFieldContainer>
        </Accordion>
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationOIDC;
