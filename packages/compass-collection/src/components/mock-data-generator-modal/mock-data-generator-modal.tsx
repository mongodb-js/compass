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
import { getNextStep, getPreviousStep } from './utils';

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
  const onNext = () => {
    const nextStep = getNextStep(currentStep);
    onCurrentStepChange(nextStep);
  };

  const onBack = () => {
    const previousStep = getPreviousStep(currentStep);
    onCurrentStepChange(previousStep);
  };

  const onCancel = () => {
    onOpenChange(false);
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
