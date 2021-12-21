import React from 'react';

import FormField, { IFormField, FormFieldValues } from './form-field';

const fields: IFormField[] = [
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
    defaultValue: '1080',
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
