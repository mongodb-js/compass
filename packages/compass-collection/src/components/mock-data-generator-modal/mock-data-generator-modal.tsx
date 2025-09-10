import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import {
  css,
  Button,
  ButtonVariant,
  ModalBody,
  ModalHeader,
  Modal,
  ModalFooter,
  spacing,
  SpinLoaderWithLabel,
} from '@mongodb-js/compass-components';

import { type MockDataGeneratorState, MockDataGeneratorStep } from './types';
import { StepButtonLabelMap } from './constants';
import type { CollectionState } from '../../modules/collection-tab';
import {
  mockDataGeneratorModalClosed,
  mockDataGeneratorNextButtonClicked,
  generateFakerMappings,
  mockDataGeneratorPreviousButtonClicked,
} from '../../modules/collection-tab';
import { default as SchemaConfirmationScreen } from './raw-schema-confirmation';
import FakerSchemaEditor from './faker-schema-editor';
import ScriptScreen from './script-screen';

const footerStyles = css`
  flex-direction: row;
  justify-content: space-between;
`;

const rightButtonsStyles = css`
  display: flex;
  gap: ${spacing[200]}px;
  flex-direction: row;
`;

const schemaEditorLoaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStep: MockDataGeneratorStep;
  onNextStep: () => void;
  onConfirmSchema: () => Promise<void>;
  onPreviousStep: () => void;
  fakerSchemaGenerationState: MockDataGeneratorState;
}

const MockDataGeneratorModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onConfirmSchema,
  onPreviousStep,
  fakerSchemaGenerationState,
}: Props) => {
  const [isSchemaConfirmed, setIsSchemaConfirmed] =
    React.useState<boolean>(false);

  const modalBodyContent = useMemo(() => {
    switch (currentStep) {
      case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
        return <SchemaConfirmationScreen />;
      case MockDataGeneratorStep.SCHEMA_EDITOR:
        {
          if (fakerSchemaGenerationState.status === 'in-progress') {
            return (
              <div
                data-testid="faker-schema-editor-loader"
                className={schemaEditorLoaderStyles}
              >
                <SpinLoaderWithLabel progressText="Processing Documents..." />
              </div>
            );
          }
          if (fakerSchemaGenerationState.status === 'completed') {
            return (
              <FakerSchemaEditor
                isSchemaConfirmed={isSchemaConfirmed}
                onSchemaConfirmed={() => setIsSchemaConfirmed(true)}
                fakerMappings={fakerSchemaGenerationState.fakerSchema}
              />
            );
          }
        }
        break;
      case MockDataGeneratorStep.DOCUMENT_COUNT:
        return <></>; // TODO: CLOUDP-333856
      case MockDataGeneratorStep.PREVIEW_DATA:
        return <></>; // TODO: CLOUDP-333857
      case MockDataGeneratorStep.GENERATE_DATA:
        return <ScriptScreen />;
    }
  }, [currentStep, fakerSchemaGenerationState]);

  const isNextButtonDisabled =
    currentStep === MockDataGeneratorStep.SCHEMA_EDITOR &&
    (!isSchemaConfirmed || fakerSchemaGenerationState.status === 'in-progress');

  const handleNextClick = () => {
    if (currentStep === MockDataGeneratorStep.GENERATE_DATA) {
      onClose();
    } else if (currentStep === MockDataGeneratorStep.SCHEMA_CONFIRMATION) {
      void onConfirmSchema();
    } else {
      onNextStep();
    }
  };

  return (
    <Modal
      size="large"
      open={isOpen}
      setOpen={(open) => {
        if (!open) {
          onClose();
        }
      }}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>
        <div data-testid={`generate-mock-data-step-${currentStep}`}>
          {modalBodyContent}
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          onClick={onPreviousStep}
          disabled={currentStep === MockDataGeneratorStep.SCHEMA_CONFIRMATION}
        >
          Back
        </Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleNextClick}
            data-testid="next-step-button"
            disabled={isNextButtonDisabled}
          >
            {StepButtonLabelMap[currentStep]}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

const mapStateToProps = (state: CollectionState) => ({
  isOpen: state.mockDataGenerator.isModalOpen,
  currentStep: state.mockDataGenerator.currentStep,
  fakerSchemaGenerationState: state.fakerSchemaGeneration,
});

const ConnectedMockDataGeneratorModal = connect(mapStateToProps, {
  onClose: mockDataGeneratorModalClosed,
  onNextStep: mockDataGeneratorNextButtonClicked,
  onConfirmSchema: generateFakerMappings,
  onPreviousStep: mockDataGeneratorPreviousButtonClicked,
})(MockDataGeneratorModal);

export default ConnectedMockDataGeneratorModal;
