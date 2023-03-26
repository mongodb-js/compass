import React from 'react';
import {
  Combobox,
  ComboboxOption,
  Select,
  Option,
} from '@mongodb-js/compass-components';
import type { Field } from '.';
import type { Document } from 'mongodb';

type ProjectFormState = {
  fields: string[];
  type: string;
};

export const mapProjectFormToStageValue = (data: ProjectFormState) => {
  const project: Document = {};
  data.fields.forEach((field) => {
    project[field] = data.type === 'Include' ? 1 : 0;
  });
  return project;
};

export const ProjectForm = ({
  initialData = { fields: [], type: '' },
  onChange,
  fields: schemaFields,
}: {
  initialData?: ProjectFormState;
  fields: Field[];
  onChange: (data: ProjectFormState) => void;
}) => {
  const setProjectType = (value: string) => {
    onChange({ fields: initialData.fields, type: value });
  };
  const setFields = (value: string[]) => {
    onChange({ fields: value, type: initialData.type });
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
      }}
    >
      <Select
        style={{ width: '100px' }}
        allowDeselect={false}
        aria-label="Select stage to edit"
        aria-labelledby="Select stage to edit"
        value={initialData.type}
        onChange={(value) => setProjectType(value)}
      >
        {['Include', 'Exclude'].map((label) => {
          return (
            <Option key={label} value={label}>
              {label}
            </Option>
          );
        })}
      </Select>
      <Combobox
        aria-label="Select a field"
        size="default"
        multiselect={true}
        clearable={false}
        initialValue={initialData.fields}
        onChange={(value: any) => setFields(value)}
      >
        {schemaFields.map(({ name, value }, index) => (
          <ComboboxOption
            key={`combobox-option-stage-${index}`}
            value={value}
            displayName={name}
          />
        ))}
      </Combobox>
    </div>
  );
};
