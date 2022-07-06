import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import {
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import { AuthMechanism } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import type { ConnectionOptions } from 'mongodb-data-service';

import AuthenticationDefault from './authentication-default';
import AuthenticationX509 from './authentication-x509';
import AuthenticationGSSAPI from './authentication-gssapi';
import AuthenticationPlain from './authentication-plain';
import AuthenticationAWS from './authentication-aws';

type AUTH_TABS =
  | 'AUTH_NONE'
  | 'DEFAULT' // Username/Password (SCRAM-SHA-1 + SCRAM-SHA-256 + DEFAULT)
  | 'MONGODB-X509'
  | 'GSSAPI' // Kerberos
  | 'PLAIN' // LDAP
  | 'MONGODB-AWS'; // AWS IAM

interface TabOption {
  id: AUTH_TABS;
  title: string;
  component: React.FC<{
    errors: ConnectionFormError[];
    connectionStringUrl: ConnectionStringUrl;
    updateConnectionFormField: UpdateConnectionFormField;
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
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const selectedAuthTabId =
    getSelectedAuthTabForConnectionString(connectionStringUrl);
  const selectedAuthTab =
    options.find(({ id }) => id === selectedAuthTabId) || options[0];

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
        onChange={optionSelected}
        value={selectedAuthTab.id}
        size="compact"
      >
        {options.map(({ title, id }) => {
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
        />
      </div>
    </div>
  );
}

export default AuthenticationTab;
