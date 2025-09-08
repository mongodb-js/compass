import {
  Body,
  css,
  Option,
  Select,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

const fieldMappingSelectorsStyles = css({
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

interface Props {
  activeJsonType: string;
  activeFakerFunction: string;
  onJsonTypeSelect: (jsonType: string) => void;
  onFakerFunctionSelect: (fakerFunction: string) => void;
}

const FakerMappingSelector = ({
  activeJsonType,
  activeFakerFunction,
  onJsonTypeSelect,
  onFakerFunctionSelect,
}: Props) => {
  return (
    <div
      className={fieldMappingSelectorsStyles}
      data-testid="field-mapping-selectors"
    >
      <Body>Mapping</Body>
      <Select
        data-testid="document-field-type-select"
        label="JSON Type"
        value={activeJsonType}
        onChange={onJsonTypeSelect}
      >
        {[activeJsonType].map((type) => (
          <Option key={type} value={type}>
            {type}
          </Option>
        ))}
      </Select>
      <Select
        data-testid="faker-funtion-select"
        label="Faker Function"
        value={activeFakerFunction}
        onChange={onFakerFunctionSelect}
      >
        {[activeFakerFunction].map((field) => (
          <Option key={field} value={field}>
            {field}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default FakerMappingSelector;
