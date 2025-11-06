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
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import FieldSelector from './schema-field-selector';
import FakerMappingSelector from './faker-mapping-selector';
import { getDefaultFakerMethod } from './script-generation-utils';
import type { FakerSchema, MockDataGeneratorState } from './types';
import type { MongoDBFieldType } from '../../schema-analysis-types';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  fakerFieldTypeChanged,
  fakerFieldMethodChanged,
} from '../../modules/collection-tab';

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
  originalLlmResponse,
  onSchemaConfirmed,
  onFieldTypeChanged,
  onFieldMethodChanged,
}: {
  fakerSchema: FakerSchema;
  originalLlmResponse: FakerSchema;
  onSchemaConfirmed: () => void;
  onFieldTypeChanged: (fieldPath: string, mongoType: MongoDBFieldType) => void;
  onFieldMethodChanged: (fieldPath: string, fakerMethod: string) => void;
}) => {
  const track = useTelemetry();

  const fieldPaths = Object.keys(fakerSchema);
  const [activeField, setActiveField] = React.useState<string>(fieldPaths[0]);

  const activeJsonType = fakerSchema[activeField]?.mongoType;
  const activeFakerFunction = fakerSchema[activeField]?.fakerMethod;
  const activeFakerArgs = fakerSchema[activeField]?.fakerArgs;

  const onJsonTypeSelect = (newJsonType: MongoDBFieldType) => {
    const currentMapping = fakerSchema[activeField];
    const originalLlmMapping = originalLlmResponse[activeField];

    if (currentMapping) {
      const previousJsonType = currentMapping.mongoType;
      const previousFakerMethod = currentMapping.fakerMethod;

      const isSwitchingToOriginalType =
        originalLlmMapping && newJsonType === originalLlmMapping.mongoType;

      if (isSwitchingToOriginalType) {
        // Restore original LLM mapping
        onFieldTypeChanged(activeField, originalLlmMapping.mongoType);
        onFieldMethodChanged(activeField, originalLlmMapping.fakerMethod);
      } else {
        // Use default faker method for new type
        const newFakerMethod = getDefaultFakerMethod(newJsonType);
        onFieldTypeChanged(activeField, newJsonType);
        onFieldMethodChanged(activeField, newFakerMethod);
      }

      const newFakerMethod = isSwitchingToOriginalType
        ? originalLlmMapping.fakerMethod
        : getDefaultFakerMethod(newJsonType);

      track('Mock Data JSON Type Changed', {
        field_name: activeField,
        previous_json_type: previousJsonType,
        new_json_type: newJsonType,
        previous_faker_method: previousFakerMethod,
        new_faker_method: newFakerMethod,
      });
    }
  };

  const onFakerFunctionSelect = (newFakerFunction: string) => {
    const currentMapping = fakerSchema[activeField];
    const originalLlmMapping = originalLlmResponse[activeField];

    if (currentMapping) {
      const previousFakerMethod = currentMapping.fakerMethod;

      const isSwitchingToLlmSuggestion =
        originalLlmMapping &&
        currentMapping.mongoType === originalLlmMapping.mongoType &&
        newFakerFunction === originalLlmMapping.fakerMethod;

      if (isSwitchingToLlmSuggestion) {
        // Restore original LLM mapping completely
        onFieldTypeChanged(activeField, originalLlmMapping.mongoType);
        onFieldMethodChanged(activeField, originalLlmMapping.fakerMethod);
      } else {
        // Just update the faker method
        onFieldMethodChanged(activeField, newFakerFunction);
      }

      track('Mock Data Faker Method Changed', {
        field_name: activeField,
        json_type: currentMapping.mongoType,
        previous_faker_method: previousFakerMethod,
        new_faker_method: newFakerFunction,
      });
    }
  };

  return (
    <>
      <div className={innerEditorStyles}>
        <FieldSelector
          activeField={activeField}
          fields={fieldPaths}
          onFieldSelect={setActiveField}
          fakerSchema={fakerSchema}
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
        onClick={onSchemaConfirmed}
      >
        Confirm mappings
      </Button>
    </>
  );
};

const FakerSchemaEditorScreen = ({
  onSchemaConfirmed,
  fakerSchemaGenerationState,
  onFieldTypeChanged,
  onFieldMethodChanged,
}: {
  onSchemaConfirmed: () => void;
  fakerSchemaGenerationState: MockDataGeneratorState;
  onFieldTypeChanged: (fieldPath: string, mongoType: MongoDBFieldType) => void;
  onFieldMethodChanged: (fieldPath: string, fakerMethod: string) => void;
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
          fakerSchema={fakerSchemaGenerationState.editedFakerSchema}
          originalLlmResponse={fakerSchemaGenerationState.originalLlmResponse}
          onSchemaConfirmed={onSchemaConfirmed}
          onFieldTypeChanged={onFieldTypeChanged}
          onFieldMethodChanged={onFieldMethodChanged}
        />
      )}
    </div>
  );
};

const mapStateToProps = () => ({
  // No additional state needed - component already receives fakerSchemaGenerationState as prop
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onFieldTypeChanged: (fieldPath: string, mongoType: MongoDBFieldType) =>
    dispatch(fakerFieldTypeChanged(fieldPath, mongoType)),
  onFieldMethodChanged: (fieldPath: string, fakerMethod: string) =>
    dispatch(fakerFieldMethodChanged(fieldPath, fakerMethod)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FakerSchemaEditorScreen);
