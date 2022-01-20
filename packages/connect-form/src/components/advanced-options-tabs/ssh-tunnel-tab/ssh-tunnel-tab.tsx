import React, { ChangeEvent, useState, useCallback } from 'react';
import { ConnectionOptions } from 'mongodb-data-service';
import {
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import {
  SSHConnectionOptions,
  SSHType,
} from '../../../utils/connection-ssh-handler';

import Identity from './ssh-tunnel-identity';
import Password from './ssh-tunnel-password';
import Socks from './ssh-tunnel-socks';
import { ConnectionFormError } from '../../../utils/validation';

interface TabOption {
  id: string;
  title: string;
  type: SSHType;
  component: React.FC<{
    sshTunnelOptions?: SSHConnectionOptions;
    updateConnectionFormField: UpdateConnectionFormField;
    connectionStringUrl: ConnectionStringUrl;
    errors: ConnectionFormError[];
  }>;
}

const options: TabOption[] = [
  {
    title: 'None',
    id: 'none',
    type: 'none',
    component: function None() {
      return <></>;
    },
  },
  {
    title: 'Use Password',
    id: 'password',
    type: 'password',
    component: Password,
  },
  {
    title: 'Use Identity File',
    id: 'identity',
    type: 'identity',
    component: Identity,
  },
  {
    title: 'Socks',
    id: 'socks',
    type: 'socks',
    component: Socks,
  },
];

const containerStyles = css({
  marginTop: spacing[3],
});

const contentStyles = css({
  marginTop: spacing[3],
  width: '50%',
});

function SSHTunnel({
  connectionOptions,
  updateConnectionFormField,
  errors,
  connectionStringUrl,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions?: ConnectionOptions;
}): React.ReactElement {
  const hasProxyHost = connectionStringUrl
    .typedSearchParams<MongoClientOptions>()
    .get('proxyHost');
  const hasIdentityFile = connectionOptions?.sshTunnel?.identityKeyFile;
  const hasPassword = connectionOptions?.sshTunnel?.password;

  const selectedOptionType: SSHType = hasProxyHost
    ? 'socks'
    : hasIdentityFile
    ? 'identity'
    : hasPassword
    ? 'password'
    : 'none';

  const selectedOptionIndex =
    options.findIndex((x) => x.type === selectedOptionType) ?? 0;
  const [selectedOption, setSelectedOption] = useState(
    options[selectedOptionIndex]
  );

  const handleOptionChanged = useCallback(
    (oldType: SSHType, newType: SSHType) => {
      let type: 'remove-proxy-options' | 'remove-ssh-options';
      switch (newType) {
        case 'socks':
          type = 'remove-ssh-options';
          break;
        case 'identity':
        case 'password':
          type = 'remove-proxy-options';
          break;
        default:
          type =
            oldType === 'socks' ? 'remove-proxy-options' : 'remove-ssh-options';
          break;
      }
      updateConnectionFormField({ type });
    },
    [updateConnectionFormField]
  );

  const optionSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      const item = options.find(({ id }) => id === event.target.value);
      if (item) {
        handleOptionChanged(selectedOption.type, item.type);
        setSelectedOption(item);
      }
    },
    [selectedOption, handleOptionChanged]
  );

  const SSLOptionContent = selectedOption.component;

  return (
    <div className={containerStyles}>
      <Label htmlFor="ssh-options-radio-box-group">
        SSH Tunnel/Proxy Method
      </Label>
      <RadioBoxGroup
        onChange={optionSelected}
        className="radio-box-group-style"
      >
        {options.map(({ title, id, type }) => {
          return (
            <RadioBox
              data-testid={`${type}-tab-button`}
              checked={selectedOption.id === id}
              value={id}
              key={id}
            >
              {title}
            </RadioBox>
          );
        })}
      </RadioBoxGroup>
      {connectionOptions && (
        <div
          className={contentStyles}
          data-testid={`${selectedOption.type}-tab-content`}
        >
          <SSLOptionContent
            errors={errors}
            sshTunnelOptions={connectionOptions.sshTunnel}
            updateConnectionFormField={updateConnectionFormField}
            connectionStringUrl={connectionStringUrl}
          />
        </div>
      )}
    </div>
  );
}

export default SSHTunnel;
