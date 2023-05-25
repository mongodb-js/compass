import type { ChangeEvent } from 'react';
import React, { useCallback, useMemo } from 'react';
import {
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import { AuthMechanism } from 'mongodb';
import { usePreference } from 'compass-preferences-model';
import type { ConnectionOptions } from 'mongodb-data-service';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';

import AuthenticationDefault from './authentication-default';
import AuthenticationX509 from './authentication-x509';
import AuthenticationGSSAPI from './authentication-gssapi';
import AuthenticationPlain from './authentication-plain';
import AuthenticationAWS from './authentication-aws';
import AuthenticationOidc from './authentication-oidc';

type AUTH_TABS =
  | 'AUTH_NONE'
  | 'DEFAULT' // Username/Password (SCRAM-SHA-1 + SCRAM-SHA-256 + DEFAULT)
  | 'MONGODB-X509'
  | 'GSSAPI' // Kerberos
  | 'PLAIN' // LDAP
  | 'MONGODB-OIDC'
  | 'MONGODB-AWS'; // AWS IAM

interface TabOption {
  id: AUTH_TABS;
  title: string;
  component: React.FC<{
    errors: ConnectionFormError[];
    connectionStringUrl: ConnectionStringUrl;
    updateConnectionFormField: UpdateConnectionFormField;
    connectionOptions: ConnectionOptions;
  }>;
}

const options: TabOption[] = [
  {
    title: 'None',
    id: 'AUTH_NONE',
    component: function None() {
      return <></>;
    },
  },
  {
    title: 'Username/Password',
    id: AuthMechanism.MONGODB_DEFAULT,
    component: AuthenticationDefault,
  },
  {
    title: 'OIDC (Preview)',
    id: AuthMechanism.MONGODB_OIDC,
    component: AuthenticationOidc,
  },
  {
    title: 'X.509',
    id: AuthMechanism.MONGODB_X509,
    component: AuthenticationX509,
  },
  {
    title: 'Kerberos',
    id: AuthMechanism.MONGODB_GSSAPI,
    component: AuthenticationGSSAPI,
  },
  {
    title: 'LDAP',
    id: AuthMechanism.MONGODB_PLAIN,
    component: AuthenticationPlain,
  },
  {
    title: 'AWS IAM',
    id: AuthMechanism.MONGODB_AWS,
    component: AuthenticationAWS,
  },
];

const containerStyles = css({
  marginTop: spacing[3],
});

const contentStyles = css({
  marginTop: spacing[3],
});

function getSelectedAuthTabForConnectionString(
  connectionStringUrl: ConnectionStringUrl
): AUTH_TABS {
  const authMechanismString = (
    connectionStringUrl.searchParams.get('authMechanism') || ''
  ).toUpperCase();

  const hasPasswordOrUsername =
    connectionStringUrl.password || connectionStringUrl.username;
  if (!authMechanismString && hasPasswordOrUsername) {
    // Default (Username/Password) auth when there is no
    // `authMechanism` and there's a username or password.
    return AuthMechanism.MONGODB_DEFAULT;
  }

  const matchingTab = options.find(({ id }) => id === authMechanismString);
  if (matchingTab) {
    return matchingTab.id;
  }

  switch (authMechanismString) {
    case AuthMechanism.MONGODB_DEFAULT:
    case AuthMechanism.MONGODB_SCRAM_SHA1:
    case AuthMechanism.MONGODB_SCRAM_SHA256:
    case AuthMechanism.MONGODB_CR:
      // We bundle SCRAM-SHA-1 and SCRAM-SHA-256 into the Username/Password bucket.
      return AuthMechanism.MONGODB_DEFAULT;
    default:
      return 'AUTH_NONE';
  }
}

function AuthenticationTab({
  errors,
  updateConnectionFormField,
  connectionStringUrl,
  connectionOptions,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const enableOIDC = !!usePreference('enableOidc', React);
  const enabledAuthOptions = useMemo(() => {
    if (enableOIDC) {
      return options;
    }
    return options.filter((option) => option.id !== 'MONGODB-OIDC');
  }, [enableOIDC]);

  const selectedAuthTabId =
    getSelectedAuthTabForConnectionString(connectionStringUrl);
  const selectedAuthTab =
    enabledAuthOptions.find(({ id }) => id === selectedAuthTabId) ||
    enabledAuthOptions[0];

  const optionSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();

      return updateConnectionFormField({
        type: 'update-auth-mechanism',
        authMechanism:
          event.target.value === 'AUTH_NONE'
            ? null
            : (event.target.value as AuthMechanism),
      });
    },
    [updateConnectionFormField]
  );

  const AuthOptionContent = selectedAuthTab.component;

  return (
    <div className={containerStyles}>
      <Label htmlFor="authentication-method-radio-box-group">
        Authentication Method
      </Label>
      <RadioBoxGroup
        id="authentication-method-radio-box-group"
        data-testid="authentication-method-radio-box-group"
        onChange={optionSelected}
        value={selectedAuthTab.id}
        size="compact"
      >
        {enabledAuthOptions.map(({ title, id }) => {
          return (
            <RadioBox
              id={`connection-authentication-method-${id}-button`}
              data-testid={`connection-authentication-method-${id}-button`}
              checked={selectedAuthTab.id === id}
              value={id}
              key={id}
            >
              {title}
            </RadioBox>
          );
        })}
      </RadioBoxGroup>
      <div
        className={contentStyles}
        data-testid={`${selectedAuthTab.id}-tab-content`}
      >
        <AuthOptionContent
          errors={errors}
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormField}
          connectionOptions={connectionOptions}
        />
      </div>
    </div>
  );
}

export default AuthenticationTab;
