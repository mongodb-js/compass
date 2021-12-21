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

type FormFieldType = 'password' | 'text' | 'number' | 'file';
export type FormFieldValues = string | number;
// export type FormFieldValues<Type> = 
// | (Type extends null ? never : string)
// | (string[] extends null ? never : string[])
// // | (Type is number ? never : number);

export interface IFormField {
  label: string;
  placeholder: string;
  type: FormFieldType;
  key: string;
  optional?: boolean;
  defaultValue?: FormFieldValues; //<ThisType<'type'>>;
  helpText?: React.ReactElement;
  errorMessage?: string;
  value?: FormFieldValues; //<ThisType<'type'>>;
}

interface IFormFieldProps {
  fields: IFormField[];
  onFieldChanged: (key: string, value: FormFieldValues) => void;
}

function FormField({
  fields,
  onFieldChanged,
}: IFormFieldProps): React.ReactElement {

  const renderFileInput = ({key, label, helpText, errorMessage, value}: IFormField) => {
    // const value = formValues[key];
    return (
      <div className={inputFieldStyles} key={key}>
        <FileInput 
          onChange={(files: string[]) => {
            onFieldChanged(key, files[0]); // todo: fix
          }}
          id={key}
          label={label}
          error={!!errorMessage}
          values={value}
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

  const renderGeneralInput = ({key, label, type, optional, placeholder, errorMessage, value}: IFormField) => {
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
        value={value}
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
