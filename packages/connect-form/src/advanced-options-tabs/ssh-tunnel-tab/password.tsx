import React from 'react';

import FormField, { IFormField, FormFieldValues } from './form-field';

const fields: IFormField[] = [
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
    optional: true,
  },
];

function Password(): React.ReactElement {
  const formFieldChanged = (key: string, value: FormFieldValues) => {
    console.log({key, value, component: 'Password'});
  };
  return <FormField fields={fields} onFieldChanged={formFieldChanged} />;
}

export default Password;
