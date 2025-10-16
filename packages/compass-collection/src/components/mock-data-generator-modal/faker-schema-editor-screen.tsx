import {
  Body,
  Button,
  ButtonSize,
  ButtonVariant,
  css,
  Link,
  palette,
  spacing,
  SpinLoaderWithLabel,
} from '@mongodb-js/compass-components';
import React from 'react';
import FieldSelector from './schema-field-selector';
import FakerMappingSelector from './faker-mapping-selector';
import { getDefaultFakerMethod } from './script-generation-utils';
import type {
  FakerSchema,
  FakerFieldMapping,
  MockDataGeneratorState,
} from './types';
import type { MongoDBFieldType } from '../../schema-analysis-types';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const innerEditorStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const titleStyles = css({
  color: palette.black,
  fontWeight: 600,
  fontSize: '16px',
  lineHeight: '20px',
  marginBottom: 0,
});

const bodyStyles = css({
  color: palette.gray.dark1,
});

const confirmMappingsButtonStyles = css({
  width: '200px',
});

const schemaEditorLoaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const FakerSchemaEditorContent = ({
  fakerSchema,
  onSchemaConfirmed,
}: {
  fakerSchema: FakerSchema;
  onSchemaConfirmed: (isConfirmed: boolean) => void;
}) => {
  const [fakerSchemaFormValues, setFakerSchemaFormValues] =
    React.useState<FakerSchema>(fakerSchema);

  // Store original LLM mappings to restore when reselecting original methods
  const originalLlmMappings = React.useRef<Record<string, FakerFieldMapping>>(
    Object.fromEntries(
      Object.entries(fakerSchema).map(([field, mapping]) => [
        field,
        {
          ...mapping,
        },
      ])
    )
  );

  const fieldPaths = Object.keys(fakerSchemaFormValues);
  const [activeField, setActiveField] = React.useState<string>(fieldPaths[0]);

  const activeJsonType = fakerSchemaFormValues[activeField]?.mongoType;
  const activeFakerFunction = fakerSchemaFormValues[activeField]?.fakerMethod;
  const activeFakerArgs = fakerSchemaFormValues[activeField]?.fakerArgs;

  const resetIsSchemaConfirmed = () => {
    onSchemaConfirmed(false);
  };

  const onJsonTypeSelect = (newJsonType: MongoDBFieldType) => {
    const currentMapping = fakerSchemaFormValues[activeField];
    const originalLlmMapping = originalLlmMappings.current[activeField];

    if (currentMapping) {
      const isSwitchingToOriginalType =
        originalLlmMapping && newJsonType === originalLlmMapping.mongoType;

      const newMapping = isSwitchingToOriginalType
        ? { ...originalLlmMapping }
        : {
            ...currentMapping,
            mongoType: newJsonType,
            fakerMethod: getDefaultFakerMethod(newJsonType),
            fakerArgs: [],
          };

      setFakerSchemaFormValues({
        ...fakerSchemaFormValues,
        [activeField]: newMapping,
      });
      resetIsSchemaConfirmed();
    }
  };

  const onFakerFunctionSelect = (newFakerFunction: string) => {
    const currentMapping = fakerSchemaFormValues[activeField];
    const originalLlmMapping = originalLlmMappings.current[activeField];

    if (currentMapping) {
      const isSwitchingToLlmSuggestion =
        originalLlmMapping &&
        currentMapping.mongoType === originalLlmMapping.mongoType &&
        newFakerFunction === originalLlmMapping.fakerMethod;

      const newMapping = isSwitchingToLlmSuggestion
        ? { ...originalLlmMapping }
        : {
            ...currentMapping,
            fakerMethod: newFakerFunction,
            fakerArgs: [],
          };

      setFakerSchemaFormValues({
        ...fakerSchemaFormValues,
        [activeField]: newMapping,
      });
      resetIsSchemaConfirmed();
    }
  };

  return (
    <>
      <div className={innerEditorStyles}>
        <FieldSelector
          activeField={activeField}
          fields={fieldPaths}
          onFieldSelect={setActiveField}
        />
        {activeJsonType && activeFakerFunction && (
          <FakerMappingSelector
            activeJsonType={activeJsonType}
            activeFakerFunction={activeFakerFunction}
            activeFakerArgs={activeFakerArgs}
            onJsonTypeSelect={onJsonTypeSelect}
            onFakerFunctionSelect={onFakerFunctionSelect}
          />
        )}
      </div>
      <Button
        size={ButtonSize.Small}
        className={confirmMappingsButtonStyles}
        variant={ButtonVariant.Primary}
        onClick={() => onSchemaConfirmed(true)}
      >
        Confirm mappings
      </Button>
    </>
  );
};

const FakerSchemaEditorScreen = ({
  onSchemaConfirmed,
  fakerSchemaGenerationState,
}: {
  isSchemaConfirmed: boolean;
  onSchemaConfirmed: (isConfirmed: boolean) => void;
  fakerSchemaGenerationState: MockDataGeneratorState;
}) => {
  return (
    <div data-testid="faker-schema-editor" className={containerStyles}>
      <div>
        <h3 className={titleStyles}>
          Confirm Field to Faker Function Mappings
        </h3>
        <Body className={bodyStyles}>
          We have sampled your collection and created a schema based on your
          documents. That schema has been sent to an LLM and it has returned the
          following mapping between your schema fields and{' '}
          <Link href="https://fakerjs.dev/api/faker.html">faker functions</Link>
          .
        </Body>
      </div>
      {fakerSchemaGenerationState.status === 'in-progress' && (
        <div
          data-testid="faker-schema-editor-loader"
          className={schemaEditorLoaderStyles}
        >
          <SpinLoaderWithLabel progressText="Processing Documents..." />
        </div>
      )}
      {fakerSchemaGenerationState.status === 'completed' && (
        <FakerSchemaEditorContent
          fakerSchema={fakerSchemaGenerationState.fakerSchema}
          onSchemaConfirmed={onSchemaConfirmed}
        />
      )}
    </div>
  );
};

export default FakerSchemaEditorScreen;
