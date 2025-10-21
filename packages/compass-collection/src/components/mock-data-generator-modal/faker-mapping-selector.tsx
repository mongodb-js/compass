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
import React, { useCallback, useMemo } from 'react';
import { UNRECOGNIZED_FAKER_METHOD } from '../../modules/collection-tab';
import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';
import { MongoDBFieldTypeValues } from '@mongodb-js/compass-generative-ai';
import { MONGO_TYPE_TO_FAKER_METHODS } from './constants';
import type { FakerArg } from './script-generation-utils';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

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

const stringifyFakerArg = (arg: FakerArg): string => {
  if (typeof arg === 'object' && arg !== null && 'json' in arg) {
    try {
      return JSON.stringify(JSON.parse(arg.json));
    } catch {
      return '';
    }
  }

  // Handle arrays recursively
  if (Array.isArray(arg)) {
    return `[${arg.map(stringifyFakerArg).join(', ')}]`;
  }

  if (typeof arg === 'string') {
    return JSON.stringify(arg);
  }

  // Numbers and booleans
  return String(arg);
};

const formatFakerFunctionCallWithArgs = (
  fakerFunction: string,
  fakerArgs: FakerArg[]
) => {
  const parsedFakerArgs = fakerArgs.map(stringifyFakerArg);
  return `faker.${fakerFunction}(${parsedFakerArgs.join(', ')})`;
};

interface Props {
  activeJsonType: MongoDBFieldType;
  activeFakerFunction: string;
  onJsonTypeSelect: (jsonType: MongoDBFieldType) => void;
  activeFakerArgs: FakerArg[];
  onFakerFunctionSelect: (fakerFunction: string) => void;
  fieldName: string;
}

const FakerMappingSelector = ({
  activeJsonType,
  activeFakerFunction,
  activeFakerArgs,
  fieldName,
  onJsonTypeSelect,
  onFakerFunctionSelect,
}: Props) => {
  const track = useTelemetry();
  const fakerMethodOptions = useMemo(() => {
    const methods = MONGO_TYPE_TO_FAKER_METHODS[activeJsonType] || [];

    if (methods.includes(activeFakerFunction)) {
      return methods;
    }

    return [activeFakerFunction, ...methods];
  }, [activeJsonType, activeFakerFunction]);

  const onFakerMethodChange = useCallback(
    (newMethod: string) => {
      track('Mock Data Faker Method Changed', {
        field_name: fieldName,
        json_type: activeJsonType,
        new_method: newMethod,
      });
      onFakerFunctionSelect(newMethod);
    },
    [activeJsonType, onFakerFunctionSelect, track]
  );

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
        onChange={(newMethod) => onFakerMethodChange(newMethod)}
      >
        {fakerMethodOptions.map((method) => (
          <Option key={method} value={method}>
            {method}
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
          <Label htmlFor="faker-function-call-preview">
            Preview Faker Function Call
          </Label>
          <Code
            id="faker-function-call-preview"
            data-testid="faker-function-call-preview"
            language="javascript"
            copyButtonAppearance="none"
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
