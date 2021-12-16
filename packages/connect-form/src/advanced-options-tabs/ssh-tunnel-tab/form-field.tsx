import React, { ChangeEvent, useState, useCallback } from 'react';
import { css } from '@emotion/css';
import { TextInput, FileInput, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  marginTop: spacing[4]
});
const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});

export type FormFieldValues = string | string[];
export interface IFormField {
  label: string;
  placeholder: string;
  type: 'password' | 'text' | 'number' | 'file';
  key: string;
  optional?: boolean;
  defaultValue?: FormFieldValues;
  helpText?: React.ReactElement;
  errorMessage?: string;
  validation?: string | CallableFunction;
}
interface IFormFieldState {
  [key: string]: FormFieldValues
};
interface IFormFieldProps {
  fields: IFormField[];
  onFieldChanged: (key: string, value: FormFieldValues) => void;
}

function FormField({
  fields,
  onFieldChanged,
}: IFormFieldProps): React.ReactElement {
  const defaultValues: IFormFieldState = {};
  fields.forEach(({key, defaultValue}) => {
    if (defaultValue) {
      defaultValues[key] = defaultValue;
    }
  });
  const [formFields, setFormFields] = useState<IFormFieldState>(defaultValues);
  const formFieldChanged = useCallback((key: string, value: FormFieldValues) => {
    setFormFields({
      ...formFields,
      [key]: value,
    });
    const field = fields.find((x) => x.key === key);
    if (field && field.validation) {
      console.log(field);
    }
    onFieldChanged(key, value);
  }, [onFieldChanged, formFields, fields]);

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
          values={(value as string[])}
          helpText={helpText}
          className={css({
            'label': {
              textAlign: 'left',
            }
          })}
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
        value={(formFields[key] as string)}
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
