import {
  Banner,
  BannerVariant,
  Body,
  css,
  Option,
  palette,
  Select,
  spacing,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { UNRECOGNIZED_FAKER_METHOD } from '../../modules/collection-tab';
import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';
import { MongoDBFieldTypeValues } from '@mongodb-js/compass-generative-ai';
import { MONGO_TYPE_TO_FAKER_METHODS } from './constants';

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
  activeJsonType: MongoDBFieldType;
  activeFakerFunction: string;
  onJsonTypeSelect: (jsonType: MongoDBFieldType) => void;
  onFakerFunctionSelect: (fakerFunction: string) => void;
}

const FakerMappingSelector = ({
  activeJsonType,
  activeFakerFunction,
  onJsonTypeSelect,
  onFakerFunctionSelect,
}: Props) => {
  const fakerMethodOptions = useMemo(() => {
    const methods = MONGO_TYPE_TO_FAKER_METHODS[activeJsonType] || [];

    if (methods.includes(activeFakerFunction)) {
      return methods;
    }

    return [activeFakerFunction, ...methods];
  }, [activeJsonType, activeFakerFunction]);

  return (
    <div className={fieldMappingSelectorsStyles}>
      <Body className={labelStyles}>Mapping</Body>
      <Select
        label="JSON Type"
        allowDeselect={false}
        value={activeJsonType}
        onChange={(value) => onJsonTypeSelect(value as MongoDBFieldType)}
      >
        {Object.values(MongoDBFieldTypeValues).map((type) => (
          <Option key={type} value={type}>
            {type}
          </Option>
        ))}
      </Select>
      <Select
        label="Faker Function"
        allowDeselect={false}
        value={activeFakerFunction}
        onChange={onFakerFunctionSelect}
      >
        {fakerMethodOptions.map((method) => (
          <Option key={method} value={method}>
            {method}
          </Option>
        ))}
      </Select>
      {activeFakerFunction === UNRECOGNIZED_FAKER_METHOD && (
        <Banner variant={BannerVariant.Warning}>
          Please select a function or we will default fill this field with the
          string &quot;Unrecognized&quot;
        </Banner>
      )}
      {/* TODO(CLOUDP-344400): Render faker function parameters once we have a way to validate them. */}
    </div>
  );
};

export default FakerMappingSelector;
