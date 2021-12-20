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
  validation?: RegExp | ((value: FormFieldValues) => boolean);
  validationMessage?: string;
}
interface IFormFieldValueState {
  [key: string]: FormFieldValues
};
interface IFormFieldErrorState {
  [key: string]: string
};
interface IFormFieldProps {
  fields: IFormField[];
  onFieldChanged: (key: string, value: FormFieldValues) => void;
}

const fieldPassesValidation = ({ validation, optional }: IFormField, value: FormFieldValues) => {
  if (!validation) {
    return true;
  }
  if (optional && value === '') {
    return true;
  }

  if (typeof validation === 'function') {
    return validation(value);
  }

  const values = typeof value === 'string' ? [value] : value;
  let isValid = true;
  values.forEach((v: string) => {
    if (!validation.exec(v)) {
      isValid = false;
    }
  });

  return isValid;
}

function FormField({
  fields,
  onFieldChanged,
}: IFormFieldProps): React.ReactElement {
  const defaultValues: IFormFieldValueState = {};
  fields.forEach(({key, defaultValue}) => {
    if (defaultValue) {
      defaultValues[key] = defaultValue;
    }
  });

  const [formValues, setFormValues] = useState<IFormFieldValueState>(defaultValues);
  const [formErrors, setFormErrors] = useState<IFormFieldErrorState>({});

  const formFieldChanged = useCallback((key: string, value: FormFieldValues) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });
    const fieldIndex = fields.findIndex((x) => x.key === key);
    const field = fields[fieldIndex];
    if (!field) {
      return;
    }
    if(fieldPassesValidation(field, value)) {
      delete formErrors[key];
      onFieldChanged(key, value);
    } else {
      formErrors[key] = field.validationMessage ?? 'Invalid value';
    }
    setFormErrors(formErrors);
  }, [onFieldChanged, setFormValues, formValues, setFormErrors, formErrors, fields]);

  const getFormInputState = useCallback(({errorMessage, key}: Pick<IFormField, 'errorMessage' | 'key'>) => {
    if (formErrors[key] || errorMessage) {
      return 'error';
    }
    if (formValues[key]) {
      return 'valid';
    }
    return 'none';
  }, [formErrors, formValues]);

  const renderFileInput = ({key, label, helpText, errorMessage}: IFormField) => {
    const value = formValues[key];
    return (
      <div className={inputFieldStyles}>
        <FileInput 
          onChange={(files: string[]) => {
            formFieldChanged(key, files);
          }}
          id={key}
          key={key}
          label={label}
          error={Boolean(formErrors[key] || errorMessage)}
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

  const renderGeneralInput = ({key, label, type, optional, placeholder, errorMessage}: IFormField) => {
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
        value={(formValues[key] as string)}
        errorMessage={formErrors[key] ?? errorMessage}
        state={getFormInputState({errorMessage, key})}
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
