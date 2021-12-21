import React, { ChangeEvent } from 'react';
import { css } from '@emotion/css';
import { TextInput, FileInput, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  marginTop: spacing[4]
});
const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});

export type FormFieldValues = string | number | string[];
export interface IFormField {
  label: string;
  placeholder: string;
  type: 'password' | 'text' | 'number' | 'file';
  key: string;
  optional?: boolean;
  defaultValue?: FormFieldValues;
  helpText?: React.ReactElement;
  errorMessage?: string;
  value?: FormFieldValues;
}

interface IFormFieldProps {
  fields: IFormField[];
  onFieldChanged: (key: string, value: any) => void;
}

function FormField({
  fields,
  onFieldChanged,
}: IFormFieldProps): React.ReactElement {

  const renderFileInput = ({key, label, helpText, errorMessage}: IFormField) => {
    // const value = formValues[key];
    return (
      <div className={inputFieldStyles} key={key}>
        <FileInput 
          onChange={(files: string[]) => {
            onFieldChanged(key, files);
          }}
          id={key}
          label={label}
          error={!!errorMessage}
          // values={(value as string[])}
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

  const renderGeneralInput = ({key, label, type, optional, placeholder, errorMessage}: IFormField) => {
    return (
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onFieldChanged(key, event.target.value);
        }}
        className={inputFieldStyles}
        key={key}
        label={label}
        type={type}
        optional={optional}
        placeholder={placeholder}
        // value={(formValues[key] as string)}
        errorMessage={errorMessage}
        // state={getFormInputState({errorMessage, key})}
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
