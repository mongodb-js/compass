import React from 'react';
import { connect } from 'react-redux';

import {
  css,
  ModalBody,
  ModalHeader,
  spacing,
} from '@mongodb-js/compass-components';

import {
  Button,
  Modal,
  ModalFooter,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { MockDataGeneratorStep } from './types';
import { StepButtonLabelMap } from './constants';
import type { CollectionState } from '../../modules/collection-tab';
import {
  mockDataGeneratorModalClosed,
  mockDataGeneratorNextButtonClicked,
  mockDataGeneratorPreviousButtonClicked,
} from '../../modules/collection-tab';
import { ConfirmationScreen } from './confirmation-screen';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import { SCHEMA_ANALYSIS_STATE_COMPLETE } from '../../schema-analysis-types';

const footerStyles = css`
  flex-direction: row;
  justify-content: space-between;
`;

const rightButtonsStyles = css`
  display: flex;
  gap: ${spacing[200]}px;
  flex-direction: row;
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStep: MockDataGeneratorStep;
  onNextStep: () => void;
  onPreviousStep: () => void;
  namespace: string; // "database.collection"
  schemaAnalysis: SchemaAnalysisState;
}

const MockDataGeneratorModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onPreviousStep,
  namespace,
  schemaAnalysis,
}: Props) => {
  const handleNextClick =
    currentStep === MockDataGeneratorStep.GENERATE_DATA ? onClose : onNextStep;

  const renderStepContent = () => {
    switch (currentStep) {
      case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
        if (schemaAnalysis.status === SCHEMA_ANALYSIS_STATE_COMPLETE) {
          return (
            <ConfirmationScreen
              namespace={namespace}
              schema={schemaAnalysis.schema}
              sampleDocument={schemaAnalysis.sampleDocument}
            />
          );
        }
        // TODO: Fallback if schema analysis is not complete
        return <div>Loading schema analysis...</div>;

      default:
        // TODO: Render other step content here based on currentStep
        return <div data-testid={`generate-mock-data-step-${currentStep}`} />;
    }
  };

  return (
    <Modal
      open={isOpen}
      setOpen={(open) => {
        if (!open) {
          onClose();
        }
      }}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>{renderStepContent()}</ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          onClick={onPreviousStep}
          disabled={currentStep === MockDataGeneratorStep.AI_DISCLAIMER}
        >
          Back
        </Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleNextClick}
            data-testid="next-step-button"
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
  schemaAnalysis: state.schemaAnalysis,
});

const ConnectedMockDataGeneratorModal = connect(mapStateToProps, {
  onClose: mockDataGeneratorModalClosed,
  onNextStep: mockDataGeneratorNextButtonClicked,
  onPreviousStep: mockDataGeneratorPreviousButtonClicked,
})(MockDataGeneratorModal);

export default ConnectedMockDataGeneratorModal;
export { MockDataGeneratorModal as UnconnectedMockDataGeneratorModal };
