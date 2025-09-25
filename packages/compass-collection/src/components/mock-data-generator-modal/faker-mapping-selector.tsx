import {
  Banner,
  BannerVariant,
  Body,
  Code,
  css,
  Label,
  Option,
  palette,
  Select,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';
import { UNRECOGNIZED_FAKER_METHOD } from '../../modules/collection-tab';
import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';
import type { FakerArg } from './script-generation-utils';

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

const parseFakerArg = (arg: FakerArg): string => {
  if (typeof arg === 'object' && arg !== null && 'json' in arg) {
    try {
      return JSON.stringify(JSON.parse(arg.json));
    } catch {
      return '';
    }
  }
  return arg.toString();
};

const formatFakerFunctionCallWithArgs = (
  fakerFunction: string,
  fakerArgs: FakerArg[]
) => {
  const parsedFakerArgs = fakerArgs.map(parseFakerArg);
  return `faker.${fakerFunction}(${parsedFakerArgs.join(', ')})`;
};

interface Props {
  activeJsonType: string;
  activeFakerFunction: string;
  onJsonTypeSelect: (jsonType: MongoDBFieldType) => void;
  activeFakerArgs: FakerArg[];
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
    <div className={fieldMappingSelectorsStyles}>
      <Body className={labelStyles}>Mapping</Body>
      <Select
        label="JSON Type"
        allowDeselect={false}
        value={activeJsonType}
        onChange={(value) => onJsonTypeSelect(value as MongoDBFieldType)}
      >
        {/* TODO(CLOUDP-344400) : Make the select input editable and render other options depending on the JSON type selected */}
        {[activeJsonType].map((type) => (
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
        {/* TODO(CLOUDP-344400): Make the select input editable and render other JSON types */}
        {[activeFakerFunction].map((field) => (
          <Option key={field} value={field}>
            {field}
          </Option>
        ))}
      </Select>
      {activeFakerFunction === UNRECOGNIZED_FAKER_METHOD ? (
        <Banner variant={BannerVariant.Warning}>
          Please select a function or we will default fill this field with the
          string &quot;Unrecognized&quot;
        </Banner>
      ) : (
        <>
          <Label htmlFor="preview-faker-function-call">
            Preview Faker Function Call
          </Label>
          <Code
            id="preview-faker-function-call"
            language="javascript"
            copyable={false}
          >
            {formatFakerFunctionCallWithArgs(
              activeFakerFunction,
              activeFakerArgs
            )}
          </Code>
        </>
      )}
    </div>
  );
};

export default FakerMappingSelector;
