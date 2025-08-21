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
}

const MockDataGeneratorModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onPreviousStep,
}: Props) => {
  const handleNextClick =
    currentStep === MockDataGeneratorStep.GENERATE_DATA ? onClose : onNextStep;

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
      <ModalBody>
        {/* TODO: Render actual step content here based on currentStep. (CLOUDP-333851) */}
        <div data-testid={`generate-mock-data-step-${currentStep}`} />
      </ModalBody>
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
});

const ConnectedMockDataGeneratorModal = connect(mapStateToProps, {
  onClose: mockDataGeneratorModalClosed,
  onNextStep: mockDataGeneratorNextButtonClicked,
  onPreviousStep: mockDataGeneratorPreviousButtonClicked,
})(MockDataGeneratorModal);

export default ConnectedMockDataGeneratorModal;
export { MockDataGeneratorModal as UnconnectedMockDataGeneratorModal };
