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
}
type FormState = {
  [key in FormKey]: string;
};


const fields: Field[] = [
  {
    key: 'hostname',
    label: 'SSH Hostname',
    type: 'text',
    placeholder: 'SSH Hostname',
  },
  {
    key: 'port',
    label: 'SSH Tunnel Port',
    type: 'number',
    placeholder: 'SSH Tunnel Port',
  },
  {
    key: 'username',
    label: 'SSH Username',
    type: 'text',
    placeholder: 'SSH Username',
  },
  {
    key: 'password',
    label: 'SSH Password',
    type: 'text',
    placeholder: 'SSH Password',
  },
];

function Password(): React.ReactElement {
  const [formFields, setFormFields] = useState<FormState>({
    hostname: '',
    username: '',
    password: '',
    port: '',
  });
  const formFieldChanged = (key: FormKey, value: string) => {
    setFormFields({
      ...formFields,
      [key]: value,
    });
  };
  return (
    <div className={containerStyles}>
      {fields.map(({placeholder, key, label, type}) => {
        return <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged(key, event.target.value);
          }}
          className={inputFieldStyles}
          key={key}
          label={label}
          type={type}
          placeholder={placeholder}
          value={formFields[key]}
        />
      })}
    </div>
  );
}

export default Password;
