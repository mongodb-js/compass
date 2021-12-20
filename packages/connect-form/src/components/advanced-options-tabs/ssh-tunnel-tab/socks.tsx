import React from 'react';

import FormField, { IFormField, FormFieldValues } from './form-field';

const fields: IFormField[] = [
  {
    key: 'hostname',
    label: 'Proxy Hostname',
    type: 'text',
    placeholder: 'Proxy Hostname',
    optional: true,
    validation: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    validationMessage: 'Hostname must be a valid host',
  },
  {
    key: 'port',
    label: 'Proxy Tunnel Port',
    type: 'number',
    placeholder: 'Proxy Tunnel Port',
    optional: true,
    defaultValue: '1080',
    validation: /^[0-9]+$/,
    validationMessage: 'Port must be a valid',
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
  },
];

function Socks(): React.ReactElement {
  const formFieldChanged = (key: string, value: FormFieldValues) => {
    console.log({key, value, component: 'Socks'});
  };
  return <FormField fields={fields} onFieldChanged={formFieldChanged} />;
}

export default Socks;
