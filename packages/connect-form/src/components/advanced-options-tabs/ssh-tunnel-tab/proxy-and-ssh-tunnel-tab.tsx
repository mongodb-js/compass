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
  TunnelType,
} from '../../../utils/connection-ssh-handler';

import SshTunnelIdentity from './ssh-tunnel-identity';
import SshTunnelPassword from './ssh-tunnel-password';
import Socks from './socks';
import { ConnectionFormError } from '../../../utils/validation';

interface TabOption {
  id: string;
  title: string;
  type: TunnelType;
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
    component: SshTunnelPassword,
  },
  {
    title: 'Use Identity File',
    id: 'identity',
    type: 'identity',
    component: SshTunnelIdentity,
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

const getSelectedTunnelType = (
  connectionStringUrl: ConnectionStringUrl,
  connectionOptions?: ConnectionOptions
): TunnelType => {
  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  const isUsingProxy =
    searchParams.get('proxyHost') ||
    searchParams.get('proxyUsername') ||
    searchParams.get('proxyPassword');

  if (isUsingProxy) {
    return 'socks';
  }

  if (
    !connectionOptions ||
    !connectionOptions?.sshTunnel ||
    !Object.values(connectionOptions.sshTunnel).find(Boolean) // If the whole object values are empty
  ) {
    return 'none';
  }

  const isUsingIdentity =
    connectionOptions.sshTunnel.identityKeyFile ||
    connectionOptions.sshTunnel.identityKeyPassphrase;
  if (isUsingIdentity) {
    return 'identity';
  }

  return 'password';
};

function ProxyAndSshTunnelTab({
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
  const selectedTunnelType: TunnelType = getSelectedTunnelType(
    connectionStringUrl,
    connectionOptions
  );

  const selectedOptionIndex =
    options.findIndex((x) => x.type === selectedTunnelType) ?? 0;
  const [selectedOption, setSelectedOption] = useState(
    options[selectedOptionIndex]
  );

  const handleOptionChanged = useCallback(
    (oldType: TunnelType, newType: TunnelType) => {
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

export default ProxyAndSshTunnelTab;
