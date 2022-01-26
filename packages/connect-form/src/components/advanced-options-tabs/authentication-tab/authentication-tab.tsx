import React, { ChangeEvent, useCallback } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormError } from '../../../utils/validation';
import { ConnectionOptions } from 'mongodb-data-service';

import AuthenticationDefault from './authentication-default';
import AuthenticationX509 from './authentication-x509';
import AuthenticationGSSAPI from './authentication-gssapi';
import AuthenticationPlain from './authentication-plain';
import AuthenticationAWS from './authentication-aws';

import { useUiKitContext } from '../../../contexts/ui-kit-context';

enum AuthMechanism {
  MONGODB_AWS = "MONGODB-AWS",
  MONGODB_CR = "MONGODB-CR",
  MONGODB_DEFAULT = "DEFAULT",
  MONGODB_GSSAPI = "GSSAPI",
  MONGODB_PLAIN = "PLAIN",
  MONGODB_SCRAM_SHA1 = "SCRAM-SHA-1",
  MONGODB_SCRAM_SHA256 = "SCRAM-SHA-256",
  MONGODB_X509 = "MONGODB-X509"
};

interface TabOption {
  id: string;
  title: string;
  component: React.FC;
}

const options: TabOption[] = [
  {
    title: 'None',
    id: '',
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

function AuthenticationTab({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions?: ConnectionOptions;
}): React.ReactElement {
  const {
    Label,
    RadioBox,
    RadioBoxGroup,
    spacing,
    css,
  } = useUiKitContext();

  const containerStyles = css({
    marginTop: spacing[3],
  });
  
  const contentStyles = css({
    marginTop: spacing[3],
    width: '50%',
  });

  const selectedAuthMechanism =
    connectionStringUrl.searchParams.get('authMechanism') ?? '';
  const selectedAuthTab =
    options.find(({ id }) => id === selectedAuthMechanism) ?? options[0];

  const optionSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      updateConnectionFormField({
        type: 'update-search-param',
        currentKey: 'authMechanism',
        value: event.target.value,
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
        <AuthOptionContent />
      </div>
    </div>
  );
}

export default AuthenticationTab;
