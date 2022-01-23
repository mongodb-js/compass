import React, { ChangeEvent, useCallback } from 'react';
import {
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { AuthMechanism } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormError } from '../../../utils/validation';
import { ConnectionOptions } from 'mongodb-data-service';

import AuthenticationDefault from './authentication-default';
import AuthenticationX509 from './authentication-x509';
import AuthenticationGSSAPI from './authentication-gssapi';
import AuthenticationPlain from './authentication-plain';
import AuthenticationAWS from './authentication-aws';

// type authMechType = typeof AuthMechanism[keyof typeof AuthMechanism];

// type ourAuthMechs = Pick<
//   keyof typeof AuthMechanism,
//   'MONGODB_DEFAULT'
// >;
// type AUTH_TABS = 'AUTH_NONE' | Pick<AuthMechanism, 'DEFAULT'>
// AuthMechanism;
// | 'AUTH_NONE'
// | AuthMechanism.MONGODB_DEFAULT
// | AuthMechanism.MONGODB_X509
// | AuthMechanism.MONGODB_GSSAPI
// | AuthMechanism.MONGODB_PLAIN
// | AuthMechanism.MONGODB_AWS;

type AUTH_TABS =
  | 'AUTH_NONE'
  | 'DEFAULT' // Username/Password (scram-sha 1 + 256)
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
    // connectionOptions?: ConnectionOptions;
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
  width: '50%',
});

function getSelectedAuthTabForConnectionString(
  connectionStringUrl: ConnectionStringUrl
): AUTH_TABS {
  const authMechanismString =
    connectionStringUrl.searchParams.get('authMechanism');

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

      if (event.target.value === 'AUTH_NONE') {
        return updateConnectionFormField({
          type: 'update-auth-mechanism',
          authMechanism: null,
        });
      }
      return updateConnectionFormField({
        type: 'update-auth-mechanism',
        authMechanism: event.target.value as AuthMechanism,
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
        onChange={optionSelected}
        className="radio-box-group-style"
        value={selectedAuthTab.id}
      >
        {options.map(({ title, id }) => {
          return (
            <RadioBox
              data-testid={`${id}-tab-button`}
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
          // connectionOptions={connectionOptions}
        />
      </div>
    </div>
  );
}

export default AuthenticationTab;
