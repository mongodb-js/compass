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

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import {
  SSHConnectionOptions,
  SSHType,
} from '../../../utils/connection-options-handler';
import {
  ConnectionFormError,
  SSHTunnelFieldError,
  SSHFormErrors,
} from '../../../utils/connect-form-errors';
import { MARKABLE_FORM_FIELD_NAMES } from '../../../constants/markable-form-fields';

import Identity from './ssh-tunnel-identity';
import Password from './ssh-tunnel-password';

interface TabOption {
  id: string;
  title: string;
  type: SSHType;
  component: React.FC<{
    sshTunnelOptions?: SSHConnectionOptions;
    onConnectionOptionChanged: (
      key: keyof SSHConnectionOptions,
      value: string | number
    ) => void;
    errors?: SSHFormErrors;
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
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  hideError: (errorIndex: number) => void;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions?: ConnectionOptions;
}): React.ReactElement {
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const optionSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const item = options.find(({ id }) => id === event.target.value);
    if (item) {
      setSelectedOption(item);
    }
  }, []);

  const onConnectionOptionChanged = useCallback(
    (key: keyof SSHConnectionOptions, value: string | number) => {
      return updateConnectionFormField({
        type: 'update-connection-options',
        currentTab: selectedOption.type,
        key,
        value,
      });
    },
    [updateConnectionFormField, selectedOption]
  );

  const sshTunnelErrors = errors.find(
    ({ fieldName }) => fieldName === MARKABLE_FORM_FIELD_NAMES.IS_SSH
  ) as SSHTunnelFieldError | undefined;

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
            errors={sshTunnelErrors?.errors}
            sshTunnelOptions={connectionOptions.sshTunnel}
            onConnectionOptionChanged={onConnectionOptionChanged}
          />
        </div>
      )}
    </div>
  );
}

export default SSHTunnel;
