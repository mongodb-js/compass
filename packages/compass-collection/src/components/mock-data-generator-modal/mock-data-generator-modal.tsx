import React, { useState } from 'react';

import { css, ModalBody, ModalHeader } from '@mongodb-js/compass-components';

import {
  Button,
  Modal,
  ModalFooter,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { MockDataGeneratorSteps } from './types';

const footerStyles = css`
  flex-direction: row;
  justify-content: space-between;
`;

const rightButtonsStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
`;

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MockDataGeneratorModal = ({ isOpen, setIsOpen }: Props) => {
  const [currentStep, setCurrentStep] = useState<MockDataGeneratorSteps>(
    MockDataGeneratorSteps.AI_DISCLAIMER
  );

  const resetState = () => {
    setCurrentStep(MockDataGeneratorSteps.AI_DISCLAIMER);
  };

  const onNext = () => {
    if (currentStep < MockDataGeneratorSteps.GENERATE_DATA) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      resetState();
    }
  };

  const onBack = () => {
    if (currentStep > MockDataGeneratorSteps.AI_DISCLAIMER) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onCancel = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      open={isOpen}
      setOpen={() => setIsOpen(false)}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>
        <div data-testid={`generate-mock-data-step-${currentStep}`} />
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button onClick={onBack}>Back</Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={ButtonVariant.Primary} onClick={onNext}>
            Next
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default MockDataGeneratorModal;
