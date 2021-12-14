import React, { ChangeEvent, useState } from 'react';
import { css } from '@emotion/css';
import { TextInput, FileInput, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  marginTop: spacing[4]
});
const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});

export interface IFormField {
  label: string;
  placeholder: string;
  type: 'password' | 'text' | 'number' | 'file';
  key: string;
  optional?: boolean;
  helpText?: React.FC;
}

export type FormFieldValues = string | string[];

function FormField({
  fields,
  onFieldChanged,
}: {
  fields: IFormField[];
  onFieldChanged: (key: string, value: FormFieldValues) => void;
}): React.ReactElement {
  const [formFields, setFormFields] = useState<{[key: string]: FormFieldValues}>({});
  const formFieldChanged = (key: string, value: FormFieldValues) => {
    setFormFields({
      ...formFields,
      [key]: value,
    });
    onFieldChanged(key, value);
  };

  const renderFileInput = ({key, label, helpText}: IFormField) => {
    const value = formFields[key];
    return (
      <div className={inputFieldStyles}>
        <FileInput 
          onChange={(files: string[]) => {
            formFieldChanged(key, files);
          }}
          id={key}
          key={key}
          label={label}
          values={Array.isArray(value) ? value : [value]}
          helpText={helpText}
        />
      </div>
    );
  }

  const renderGeneralInput = ({key, label, type, optional, placeholder}: IFormField) => {
    return (
      <TextInput
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
    );
  }

  return (
    <div className={containerStyles}>
      {fields.map((field: IFormField) => {
        return field.type === 'file'
          ? renderFileInput(field)
          : renderGeneralInput(field);
      })}
    </div>
  );
}

export default FormField;
