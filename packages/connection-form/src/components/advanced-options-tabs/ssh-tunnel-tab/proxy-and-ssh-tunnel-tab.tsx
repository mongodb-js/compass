import type { ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import {
  Label,
  RadioBox,
  RadioBoxGroup,
  css,
  FormFieldContainer,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type {
  SSHConnectionOptions,
  TunnelType,
} from '../../../utils/connection-ssh-handler';

import SshTunnelIdentity from './ssh-tunnel-identity';
import SshTunnelPassword from './ssh-tunnel-password';
import Socks from './socks';
import { AppLevelProxy } from './app-proxy';
import type { ConnectionFormError } from '../../../utils/validation';

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
    title: 'SSH with Password',
    id: 'password',
    type: 'ssh-password',
    component: SshTunnelPassword,
  },
  {
    title: 'SSH with Identity File',
    id: 'identity',
    type: 'ssh-identity',
    component: SshTunnelIdentity,
  },
  {
    title: 'Socks5',
    id: 'socks',
    type: 'socks',
    component: Socks,
  },
  {
    title: 'Application-level Proxy',
    id: 'app-proxy',
    type: 'app-proxy',
    component: AppLevelProxy,
  },
];

const contentStyles = css({
  display: 'contents',
});

const getSelectedTunnelType = (
  connectionStringUrl: ConnectionStringUrl,
  connectionOptions?: ConnectionOptions
): TunnelType => {
  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  const isUsingSocksProxy =
    searchParams.get('proxyHost') ||
    searchParams.get('proxyPort') ||
    searchParams.get('proxyUsername') ||
    searchParams.get('proxyPassword');

  if (isUsingSocksProxy) {
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
    return 'ssh-identity';
  }

  return 'ssh-password';
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
        case 'ssh-identity':
        case 'ssh-password':
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

  const TunnelContent = selectedOption.component;

  return (
    <>
      <FormFieldContainer>
        <Label htmlFor="ssh-options-radio-box-group">
          SSH Tunnel/Proxy Method
        </Label>
        <RadioBoxGroup
          id="ssh-options-radio-box-group"
          onChange={optionSelected}
          size="compact"
          className="radio-box-group-style"
        >
          {options.map(({ title, id, type }) => {
            return (
              <RadioBox
                id={`${type}-tab-button`}
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
      </FormFieldContainer>
      {connectionOptions && (
        <div
          className={contentStyles}
          data-testid={`${selectedOption.type}-tab-content`}
        >
          <TunnelContent
            errors={errors}
            sshTunnelOptions={connectionOptions.sshTunnel}
            updateConnectionFormField={updateConnectionFormField}
            connectionStringUrl={connectionStringUrl}
          />
        </div>
      )}
    </>
  );
}

export default ProxyAndSshTunnelTab;
