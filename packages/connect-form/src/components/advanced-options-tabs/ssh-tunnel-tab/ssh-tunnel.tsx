import React, { ChangeEvent, useState, useCallback } from 'react';
import { css } from '@emotion/css';
import { ConnectionOptions } from 'mongodb-data-service';
import {
  RadioBox,
  RadioBoxGroup,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { SSHConnectionOptions, UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormError, SSHTunnelFieldError, SSHFormErrors } from '../../../utils/connect-form-errors';

import Identity from './ssh-tunnel-identity';
import None from './ssh-tunnel-none';
import Password from './ssh-tunnel-password';
import Socks from './ssh-tunnel-socks';
import { MARKABLE_FORM_FIELD_NAMES } from '../../../constants/markable-form-fields';

interface TabOption {
  id: string;
  title: string;
  component: React.FC<{
    sshTunnelOptions?: SSHConnectionOptions;
    onConnectionOptionChanged: (key: keyof SSHConnectionOptions, value: string | number) => void;
    errors?: SSHFormErrors;
  }>;
}

const options: TabOption[] = [
  {
    title: 'None',
    id: 'none',
    component: None,
  },
  {
    title: 'Use Password',
    id: 'password',
    component: Password,
  },
  {
    title: 'Use Identity File',
    id: 'identity',
    component: Identity,
  },
  {
    title: 'Socks5',
    id: 'socks',
    component: Socks,
  },
];

const containerStyles = css({
  marginTop: spacing[4],
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
        key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const sshTunnelErrors: SSHTunnelFieldError | undefined = errors.find(({fieldName}) => fieldName === MARKABLE_FORM_FIELD_NAMES.IS_SSH);

  const SSLOptionContent = selectedOption.component;

  return (
    <div className={containerStyles}>
      <RadioBoxGroup
        onChange={optionSelected}
        className="radio-box-group-style"
      >
        {options.map(({ title, id }) => {
          return (
            <RadioBox checked={selectedOption.id === id} value={id} key={id}>
              {title}
            </RadioBox>
          );
        })}
      </RadioBoxGroup>
      {connectionOptions && (
        <div className={containerStyles}>
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
