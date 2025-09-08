import {
  Body,
  Button,
  ButtonVariant,
  css,
  H3,
  Link,
  spacing,
  VerticalRule,
} from '@mongodb-js/compass-components';
import React from 'react';
import FieldSelector from './schema-field-selector';
import FakerMappingSelector from './field-mapping-selectors';
import { FakerMapping } from './types';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const innerEditorStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  maxHeight: '500px',
  overflow: 'auto',
});

const confirmMappingsButtonStyles = css({
  width: '200px',
});

const FakerSchemaEditor = ({
  fakerSchema,
}: {
  fakerSchema: Array<FakerMapping>;
}) => {
  const [fakerSchemaFormValues, setFakerSchemaFormValues] =
    React.useState<Array<FakerMapping>>(fakerSchema);
  const [activeField, setActiveField] = React.useState<string>(
    fakerSchemaFormValues[0].fieldPath
  );

  const activeJsonType = fakerSchemaFormValues.find(
    (mapping) => mapping.fieldPath === activeField
  )?.mongoType;
  const activeFakerFunction = fakerSchemaFormValues.find(
    (mapping) => mapping.fieldPath === activeField
  )?.fakerMethod;

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
    }
  };

  const onConfirmMappings = () => {
    console.log('Clicked confirm mappings');
  };

const FakerSchemaEditorScreen = () => {
  return (
    <div data-testid="faker-schema-editor" className={containerStyles}>
      <div>
        <H3>Confirm Field to Faker Function Mappings</H3>
        <Body>
          We have sampled your collection and created a schema based on your
          documents. That schema has been sent to an LLM and it has returned the
          following mapping between your schema fields and{' '}
          <Link href="TODO">faker functions</Link>.
        </Body>
      </div>
      <div className={innerEditorStyles}>
        <FieldSelector
          activeField={activeField}
          fields={fakerSchemaFormValues.map((mapping) => mapping.fieldPath)}
          onFieldSelect={setActiveField}
        />
        <VerticalRule />
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
        className={confirmMappingsButtonStyles}
        variant={ButtonVariant.Primary}
        onClick={onConfirmMappings}
      >
        Confirm mappings
      </Button>
    </div>
  );
};

export default FakerSchemaEditorScreen;
