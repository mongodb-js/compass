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

/**
 * Renders read-only TextInput components for each key-value pair in a faker arguments object.
 */
const getFakerArgsInputFromObject = (fakerArgsObject: Record<string, any>) => {
  return Object.entries(fakerArgsObject).map(([key, item]: [string, any]) => {
    if (typeof item === 'string' || typeof item === 'boolean') {
      return (
        <TextInput
          key={`faker-arg-${key}`}
          type="text"
          label={key}
          aria-label={`Faker Arg ${key}`}
          readOnly
          value={item.toString()}
        />
      );
    } else if (typeof item === 'number') {
      return (
        <TextInput
          key={`faker-arg-${key}`}
          type="number"
          label={key}
          aria-label={`Faker Arg ${key}`}
          readOnly
          value={item.toString()}
        />
      );
    } else if (
      Array.isArray(item) &&
      item.length > 0 &&
      typeof item[0] === 'string'
    ) {
      return (
        <TextInput
          key={`faker-arg-${key}`}
          type="text"
          label={key}
          aria-label={`Faker Arg ${key}`}
          readOnly
          value={item.join(', ')}
        />
      );
    }
    return null;
  });
};

/**
 * Renders TextInput components for each faker argument based on its type.
 */
const getFakerArgsInput = (fakerArgs: FakerArg[]) => {
  return fakerArgs.map((arg, idx) => {
    if (typeof arg === 'string' || typeof arg === 'boolean') {
      return (
        <TextInput
          key={`faker-arg-${idx}`}
          type="text"
          label="Faker Arg"
          readOnly
          value={arg.toString()}
        />
      );
    } else if (typeof arg === 'number') {
      return (
        <TextInput
          key={`faker-arg-${idx}`}
          type="number"
          label="Faker Arg"
          readOnly
          value={arg.toString()}
        />
      );
    } else if (typeof arg === 'object' && 'json' in arg) {
      // parse the object
      let parsedArg;
      try {
        parsedArg = JSON.parse(arg.json);
      } catch {
        // If parsing fails, skip rendering this arg
        return null;
      }
      if (typeof parsedArg === 'object') {
        return getFakerArgsInputFromObject(parsedArg);
      }
    }
  });
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
      {activeFakerFunction === UNRECOGNIZED_FAKER_METHOD && (
        <Banner variant={BannerVariant.Warning}>
          Please select a function or we will default fill this field with the
          string &quot;Unrecognized&quot;
        </Banner>
      )}
      {getFakerArgsInput(activeFakerArgs)}
    </div>
  );
};

export default FakerMappingSelector;
