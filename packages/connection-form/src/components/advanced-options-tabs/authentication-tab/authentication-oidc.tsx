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
import { getConnectionStringUsername } from '../../../utils/connection-string-helpers';
import type { OIDCOptions } from '../../../utils/oidc-handler';
import { useConnectionFormPreference } from '../../../hooks/use-connect-form-preferences';

type AuthFlowType = NonNullable<OIDCOptions['allowedFlows']>[number];

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
    <K extends keyof OIDCOptions>(key: K, value?: OIDCOptions[K]) => {
      return updateConnectionFormField({
        type: 'update-oidc-param',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const hasEnabledDeviceAuthFlow =
    !!connectionOptions.oidc?.allowedFlows?.includes?.('device-auth');

  const showOIDCDeviceAuthFlow = !!useConnectionFormPreference(
    'showOIDCDeviceAuthFlow'
  );

  return (
    <>
      <FormFieldContainer>
        <TextInput
          data-testid="connection-oidc-username-input"
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            return updateConnectionFormField({
              type: 'update-username',
              username: value,
            });
          }}
          label="Username"
          optional
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
                handleFieldChanged('redirectURI', value);
              }}
              optional
              label="Auth Code Flow Redirect URI"
              value={connectionOptions?.oidc?.redirectURI || ''}
              description="This value needs to match the configuration of the Identity Provider used by the server."
            />
          </FormFieldContainer>

          <FormFieldContainer>
            <Checkbox
              onChange={({
                target: { checked },
              }: React.ChangeEvent<HTMLInputElement>) => {
                if (checked) {
                  return handleFieldChanged('enableUntrustedEndpoints', true);
                }

                // Unset the allowed hosts.
                return handleFieldChanged(
                  'enableUntrustedEndpoints',
                  undefined
                );
              }}
              data-testid="oidc-allow-untrusted-endpoint-input"
              id="oidc-allow-untrusted-endpoint-input"
              label={
                <>
                  <Label htmlFor="oidc-allow-untrusted-endpoint-input">
                    Consider Target Endpoint Trusted
                  </Label>
                  <Description>
                    Allow connecting when the target endpoint is not in the list
                    of endpoints that are considered trusted by default. Only
                    use this option when connecting to servers that you trust.
                  </Description>
                </>
              }
              checked={!!connectionOptions.oidc?.enableUntrustedEndpoints}
            />
          </FormFieldContainer>

          {showOIDCDeviceAuthFlow && (
            <FormFieldContainer>
              <Checkbox
                onChange={({
                  target: { checked },
                }: React.ChangeEvent<HTMLInputElement>) => {
                  if (checked) {
                    const newAllowedFlows: AuthFlowType[] = [
                      'auth-code',
                      'device-auth',
                    ];
                    return handleFieldChanged('allowedFlows', newAllowedFlows);
                  }

                  // If checked then unchecked this will leave the `allowedHosts`
                  // as ['auth-code'], which is what we default to in the data-service.
                  const newAllowedFlows = (
                    connectionOptions.oidc?.allowedFlows as AuthFlowType[]
                  )?.filter?.((allowedFlow) => allowedFlow !== 'device-auth');
                  handleFieldChanged(
                    'allowedFlows',
                    newAllowedFlows.length > 0 ? newAllowedFlows : undefined
                  );
                }}
                data-testid="oidc-enable-device-auth-flow-input"
                id="oidc-enable-device-auth-flow-input"
                label={
                  <>
                    <Label htmlFor="oidc-enable-device-auth-flow-input">
                      Enable Device Authentication Flow
                    </Label>
                    <Description>
                      Less secure authentication flow that can be used as a
                      fallback when browser-based authentication is unavailable.
                    </Description>
                  </>
                }
                checked={hasEnabledDeviceAuthFlow}
              />
            </FormFieldContainer>
          )}
        </Accordion>
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationOIDC;
