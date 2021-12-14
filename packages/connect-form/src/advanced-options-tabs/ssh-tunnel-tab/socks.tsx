import React, { useState, ChangeEvent } from 'react';
import { css } from '@emotion/css';
import { TextInput, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  marginTop: spacing[4]
});

const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});


type FormKey = 'hostname' | 'port' | 'username' | 'password';
interface Field {
  label: string;
  placeholder: string;
  type: 'password' | 'text' | 'number';
  key: FormKey;
  optional: boolean;
}
type FormState = {
  [key in FormKey]: string;
};


const fields: Field[] = [
  {
    key: 'hostname',
    label: 'Proxy Hostname',
    type: 'text',
    placeholder: 'Proxy Hostname',
    optional: true,
  },
  {
    key: 'port',
    label: 'Proxy Tunnel Port',
    type: 'number',
    placeholder: 'Proxy Tunnel Port',
    optional: true,
  },
  {
    key: 'username',
    label: 'Proxy Username',
    type: 'text',
    placeholder: 'Proxy Username',
    optional: true,
  },
  {
    key: 'password',
    label: 'Proxy Password',
    type: 'text',
    placeholder: 'Proxy Password',
    optional: false,
  },
];

function Socks(): React.ReactElement {
  const [formFields, setFormFields] = useState<FormState>({
    hostname: '',
    username: '',
    password: '',
    port: '1080',
  });
  const formFieldChanged = (key: FormKey, value: string) => {
    setFormFields({
      ...formFields,
      [key]: value,
    });
  };
  return (
    <div className={containerStyles}>
      {fields.map(({placeholder, key, label, type, optional}) => {
        return <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged(key, event.target.value);
          }}
          className={inputFieldStyles}
          key={key}
          label={label}
          type={type}
          optional={optional}
          placeholder={placeholder}
          value={formFields[key]}
        />
      })}
    </div>
  );
}

export default Socks;
