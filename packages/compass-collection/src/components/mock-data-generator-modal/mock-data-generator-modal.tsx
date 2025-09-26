import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import {
  css,
  Body,
  Button,
  ButtonVariant,
  ModalBody,
  ModalHeader,
  Modal,
  ModalFooter,
  spacing,
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
import RawSchemaConfirmationScreen from './raw-schema-confirmation-screen';
import FakerSchemaEditorScreen from './faker-schema-editor-screen';
import ScriptScreen from './script-screen';
import PreviewScreen from './preview-screen';

const footerStyles = css`
  flex-direction: row;
  justify-content: space-between;
`;

const rightButtonsStyles = css`
  display: flex;
  gap: ${spacing[200]}px;
  flex-direction: row;
`;

const namespaceStyles = css({
  marginTop: spacing[200],
  marginBottom: spacing[400],
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStep: MockDataGeneratorStep;
  onNextStep: () => void;
  onConfirmSchema: () => Promise<void>;
  onPreviousStep: () => void;
  namespace: string;
  fakerSchemaGenerationState: MockDataGeneratorState;
}

const MockDataGeneratorModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onConfirmSchema,
  onPreviousStep,
  namespace,
  fakerSchemaGenerationState,
}: Props) => {
  const [isSchemaConfirmed, setIsSchemaConfirmed] =
    React.useState<boolean>(false);

  const modalBodyContent = useMemo(() => {
    switch (currentStep) {
      case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
        return <RawSchemaConfirmationScreen />;
      case MockDataGeneratorStep.SCHEMA_EDITOR:
        return (
          <FakerSchemaEditorScreen
            isSchemaConfirmed={isSchemaConfirmed}
            onSchemaConfirmed={setIsSchemaConfirmed}
            fakerSchemaGenerationState={fakerSchemaGenerationState}
          />
        );
      case MockDataGeneratorStep.DOCUMENT_COUNT:
        return <></>; // TODO(CLOUDP-333856)
      case MockDataGeneratorStep.PREVIEW_DATA:
        // TODO(CLOUDP-333855): Apply results from schema editor confirmation
        //
        // function validateFakerSchema(input: FakerSchemaMapping): asserts input is ValidatedFakerSchemaMapping {
        //     ...
        // }
        return (
          <PreviewScreen
            confirmedFakerSchema={
              fakerSchemaGenerationState.status === 'completed'
                ? fakerSchemaGenerationState.fakerSchema
                : {}
            }
          />
        );
      case MockDataGeneratorStep.GENERATE_DATA:
        return <ScriptScreen />;
    }
  }, [currentStep, fakerSchemaGenerationState, isSchemaConfirmed]);

  const isNextButtonDisabled =
    currentStep === MockDataGeneratorStep.SCHEMA_EDITOR && !isSchemaConfirmed;

  const handleNextClick = () => {
    if (currentStep === MockDataGeneratorStep.GENERATE_DATA) {
      onClose();
    } else if (currentStep === MockDataGeneratorStep.SCHEMA_CONFIRMATION) {
      void onConfirmSchema();
    } else {
      onNextStep();
    }
  };

  const shouldShowNamespace =
    currentStep !== MockDataGeneratorStep.GENERATE_DATA;

  const handlePreviousClick = () => {
    if (currentStep === MockDataGeneratorStep.SCHEMA_EDITOR) {
      // reset isSchemaConfirmed state when previous step is clicked
      setIsSchemaConfirmed(false);
    }
    onPreviousStep();
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
        {shouldShowNamespace && (
          <Body className={namespaceStyles}>{namespace}</Body>
        )}
        <div data-testid={`generate-mock-data-step-${currentStep}`}>
          {modalBodyContent}
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          onClick={handlePreviousClick}
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
  namespace: state.namespace,
  fakerSchemaGenerationState: state.fakerSchemaGeneration,
});

const ConnectedMockDataGeneratorModal = connect(mapStateToProps, {
  onClose: mockDataGeneratorModalClosed,
  onNextStep: mockDataGeneratorNextButtonClicked,
  onConfirmSchema: generateFakerMappings,
  onPreviousStep: mockDataGeneratorPreviousButtonClicked,
})(MockDataGeneratorModal);

export default ConnectedMockDataGeneratorModal;
