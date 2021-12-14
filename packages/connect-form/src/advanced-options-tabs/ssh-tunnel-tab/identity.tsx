import React, { useState, ChangeEvent } from 'react';
import { css } from '@emotion/css';
import { TextInput, FileInput, spacing, Icon } from '@mongodb-js/compass-components';

const containerStyles = css({
  marginTop: spacing[4]
});

const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});

const fileHelpStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'start',
  alignItems: 'center',
});

type FormKey = 'hostname' | 'port' | 'username' | 'file' | 'passphrase';
interface Field {
  label: string;
  placeholder: string;
  type: 'file' | 'text' | 'number';
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
    key: 'file',
    label: 'SSH Identity File',
    type: 'file',
    placeholder: 'SSH Identity File',
  },
  {
    key: 'passphrase',
    label: 'SSH Passphrase',
    type: 'text',
    placeholder: 'SSH Passphrase',
  },
];

function Identity(): React.ReactElement {
  const [formFields, setFormFields] = useState<FormState>({
    hostname: '',
    username: '',
    passphrase: '',
    file: '',
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
        if (type === 'file') {
          return (
            <div className={inputFieldStyles}>
              <FileInput 
                onChange={(files: string[]) => {
                  formFieldChanged(key, files[0] ?? '');
                }}
                id={key}
                key={key}
                label={label}
                values={[formFields[key]]}
                helpText={
                  <div className={fileHelpStyles}>
                    <a href="https://mongodb.com">Learn More</a>
                    <Icon glyph="OpenNewTab" />
                  </div>
                }
              />
            </div>
          );
        }
        return (
          <TextInput
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
        );
      })}
    </div>
  );
}

export default Identity;
