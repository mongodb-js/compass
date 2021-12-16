import React from 'react';
import { css } from '@emotion/css';
import { Icon } from '@mongodb-js/compass-components';

import FormField, { IFormField, FormFieldValues } from './form-field';

const fileHelpStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'start',
  alignItems: 'center',
});

const fields: IFormField[] = [
  {
    key: 'hostname',
    label: 'SSH Hostname',
    type: 'text',
    placeholder: 'SSH Hostname',
    validation: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    validationMessage: 'Hostname must be a valid host',
  },
  {
    key: 'port',
    label: 'SSH Tunnel Port',
    type: 'number',
    placeholder: 'SSH Tunnel Port',
    validation: /^[0-9]+$/,
    validationMessage: 'Port must be a valid',
  },
  {
    key: 'username',
    label: 'SSH Username',
    type: 'text',
    placeholder: 'SSH Username',
  },
  {
    key: 'file',
    label: 'SSH Identity File',
    type: 'file',
    placeholder: 'SSH Identity File',
    helpText: <div className={fileHelpStyles}>
      <a href="https://mongodb.com">Learn More</a>
      <Icon glyph="OpenNewTab" />
    </div>,
  },
  {
    key: 'passphrase',
    label: 'SSH Passphrase',
    type: 'text',
    placeholder: 'SSH Passphrase',
    optional: true,
  },
];

function Identity(): React.ReactElement {
  const formFieldChanged = (key: string, value: FormFieldValues) => {
    console.log({key, value, component: 'Identity'});
  };
  return <FormField fields={fields} onFieldChanged={formFieldChanged} />;
}

export default Identity;
