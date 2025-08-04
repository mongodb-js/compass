import React from 'react';

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
  onOpenChange: (isOpen: boolean) => void;
  currentStep: MockDataGeneratorStep;
  onCurrentStepChange: (step: MockDataGeneratorStep) => void;
}

const MockDataGeneratorModal = ({
  isOpen,
  onOpenChange,
  currentStep,
  onCurrentStepChange,
}: Props) => {
  const resetState = () => {
    onCurrentStepChange(MockDataGeneratorStep.AI_DISCLAIMER);
  };

  const onNext = () => {
    if (currentStep < MockDataGeneratorStep.GENERATE_DATA) {
      onCurrentStepChange(currentStep + 1);
    } else {
      onOpenChange(false);
      resetState();
    }
  };

  const onBack = () => {
    if (currentStep > MockDataGeneratorStep.AI_DISCLAIMER) {
      onCurrentStepChange(currentStep - 1);
    }
  };

  const onCancel = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Modal
      open={isOpen}
      setOpen={(open) => onOpenChange(open)}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>
        {/* TODO: Render actual step content here based on currentStep. (CLOUDP-333851) */}
        <div data-testid={`generate-mock-data-step-${currentStep}`} />
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          onClick={onBack}
          disabled={currentStep === MockDataGeneratorStep.AI_DISCLAIMER}
        >
          Back
        </Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            variant={ButtonVariant.Primary}
            onClick={onNext}
            data-testid="next-step-button"
          >
            {StepButtonLabelMap[currentStep]}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default MockDataGeneratorModal;
