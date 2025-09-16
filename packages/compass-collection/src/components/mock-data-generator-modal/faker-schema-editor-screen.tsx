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
import type { FakerSchemaMapping, MockDataGeneratorState } from './types';

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
  fakerSchemaMappings,
  onSchemaConfirmed,
}: {
  fakerSchemaMappings: FakerSchemaMapping[];
  onSchemaConfirmed: (isConfirmed: boolean) => void;
}) => {
  const [fakerSchemaFormValues, setFakerSchemaFormValues] =
    React.useState<Array<FakerSchemaMapping>>(fakerSchemaMappings);
  const [activeField, setActiveField] = React.useState<string>(
    fakerSchemaFormValues[0].fieldPath
  );

  const activeJsonType = fakerSchemaFormValues.find(
    (mapping) => mapping.fieldPath === activeField
  )?.mongoType;
  const activeFakerFunction = fakerSchemaFormValues.find(
    (mapping) => mapping.fieldPath === activeField
  )?.fakerMethod;

  const resetIsSchemaConfirmed = () => {
    onSchemaConfirmed(false);
  };

  const onJsonTypeSelect = (newJsonType: string) => {
    const updatedFakerFieldMapping = fakerSchemaFormValues.find(
      (mapping) => mapping.fieldPath === activeField
    );
    if (updatedFakerFieldMapping) {
      updatedFakerFieldMapping.mongoType = newJsonType;
      setFakerSchemaFormValues(
        fakerSchemaFormValues.map((mapping) =>
          mapping.fieldPath === activeField ? updatedFakerFieldMapping : mapping
        )
      );
      resetIsSchemaConfirmed();
    }
  };

  const onFakerFunctionSelect = (newFakerFunction: string) => {
    const updatedFakerFieldMapping = fakerSchemaFormValues.find(
      (mapping) => mapping.fieldPath === activeField
    );
    if (updatedFakerFieldMapping) {
      updatedFakerFieldMapping.fakerMethod = newFakerFunction;
      setFakerSchemaFormValues(
        fakerSchemaFormValues.map((mapping) =>
          mapping.fieldPath === activeField ? updatedFakerFieldMapping : mapping
        )
      );
      resetIsSchemaConfirmed();
    }
  };

  return (
    <>
      <div className={innerEditorStyles}>
        <FieldSelector
          activeField={activeField}
          fields={fakerSchemaFormValues.map((mapping) => mapping.fieldPath)}
          onFieldSelect={setActiveField}
        />
        {activeJsonType && activeFakerFunction && (
          <FakerMappingSelector
            activeJsonType={activeJsonType}
            activeFakerFunction={activeFakerFunction}
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
          fakerSchemaMappings={fakerSchemaGenerationState.fakerSchema}
          onSchemaConfirmed={onSchemaConfirmed}
        />
      )}
    </div>
  );
};

export default FakerSchemaEditorScreen;
