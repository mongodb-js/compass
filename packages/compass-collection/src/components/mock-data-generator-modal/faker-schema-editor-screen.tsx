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
import FieldSelector from './schema-field-selector';
import FakerMappingSelector from './faker-mapping-selector';
import type { FakerSchema, MockDataGeneratorState } from './types';
import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';
import {
  fakerFieldTypeChanged,
  fakerFieldMethodChanged,
  type FakerFieldTypeChangedAction,
  type FakerFieldMethodChangedAction,
} from '../../modules/collection-tab';

type FakerSchemaDispatch = (
  action: FakerFieldTypeChangedAction | FakerFieldMethodChangedAction
) => void;

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
  dispatch,
}: {
  fakerSchema: FakerSchema;
  onSchemaConfirmed: (isConfirmed: boolean) => void;
  dispatch: FakerSchemaDispatch;
}) => {
  const fieldPaths = Object.keys(fakerSchema);
  const [activeField, setActiveField] = React.useState<string>(fieldPaths[0]);

  const activeJsonType = fakerSchema[activeField]?.mongoType;
  const activeFakerFunction = fakerSchema[activeField]?.fakerMethod;
  const activeFakerArgs = fakerSchema[activeField]?.fakerArgs;

  const resetIsSchemaConfirmed = () => {
    onSchemaConfirmed(false);
  };

  const onJsonTypeSelect = (newJsonType: MongoDBFieldType) => {
    const currentMapping = fakerSchema[activeField];
    if (currentMapping) {
      dispatch(fakerFieldTypeChanged(activeField, newJsonType));
      resetIsSchemaConfirmed();
    }
  };

  const onFakerFunctionSelect = (newFakerFunction: string) => {
    const currentMapping = fakerSchema[activeField];
    if (currentMapping) {
      dispatch(fakerFieldMethodChanged(activeField, newFakerFunction));
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
  dispatch,
}: {
  onSchemaConfirmed: (isConfirmed: boolean) => void;
  fakerSchemaGenerationState: MockDataGeneratorState;
  dispatch: FakerSchemaDispatch;
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
          onSchemaConfirmed={onSchemaConfirmed}
          dispatch={dispatch}
        />
      )}
    </div>
  );
};

export default connect()(FakerSchemaEditorScreen);
