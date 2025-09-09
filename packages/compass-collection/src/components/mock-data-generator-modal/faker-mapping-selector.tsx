import {
  Banner,
  BannerVariant,
  Body,
  css,
  Option,
  palette,
  Select,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import React from 'react';
import { UNRECOGNIZED_FAKER_METHOD } from '../../modules/collection-tab';

const fieldMappingSelectorsStyles = css({
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const labelStyles = css({
  color: palette.gray.dark1,
  fontWeight: 600,
});

interface Props {
  activeJsonType: string;
  activeFakerFunction: string;
  activeFakerArgs: Array<string | number | boolean | { json: string }>;
  onJsonTypeSelect: (jsonType: string) => void;
  onFakerFunctionSelect: (fakerFunction: string) => void;
}

const FakerMappingSelector = ({
  activeJsonType,
  activeFakerFunction,
  activeFakerArgs,
  onJsonTypeSelect,
  onFakerFunctionSelect,
}: Props) => {
  return (
    <div
      className={fieldMappingSelectorsStyles}
      data-testid="field-mapping-selectors"
    >
      <Body className={labelStyles}>Mapping</Body>
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
      {activeFakerFunction === UNRECOGNIZED_FAKER_METHOD && (
        <Banner variant={BannerVariant.Warning}>
          Please select a function or we will default fill this field with the
          string “PLACEHOLDER”
        </Banner>
      )}
      {activeFakerArgs.map((arg, idx) => {
        if (typeof arg === 'string') {
          return (
            <TextInput
              key={idx}
              label={`Faker Function Parameter ${typeof arg}`}
              readOnly
              value={arg}
            />
          );
        }
        if (typeof arg === 'number') {
          return (
            <TextInput
              key={idx}
              label={`Faker Function Parameter ${typeof arg}`}
              readOnly
              value={arg.toString()}
            />
          );
        }
        if (typeof arg === 'boolean') {
          return (
            <TextInput
              key={idx}
              label={`Faker Function Parameter ${typeof arg}`}
              readOnly
              value={arg.toString()}
            />
          );
        }
        return (
          <TextInput
            key={idx}
            label={`Faker Function Parameter ${typeof arg}`}
            readOnly
            value={JSON.stringify(arg.json)}
          />
        );
      })}
    </div>
  );
};

export default FakerMappingSelector;
