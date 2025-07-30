import React, { useState } from 'react';

import { css } from '@mongodb-js/compass-components';

import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { MockDataGeneratorSteps } from './types';
import { DEFAULT_OUTPUT_DOCS_COUNT } from './constants';

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
  const [rawSchema, setRawSchema] = useState<string | null>(null);
  const [fakerSchema, setFakerSchema] = useState<string | null>(null);
  const [outputDocsCount, setOutputDocsCount] = useState<number>(
    DEFAULT_OUTPUT_DOCS_COUNT
  );
  const [validationRules, setValidationRules] = useState<string | null>(null);
  const [sampleDoc, setSampleDoc] = useState<string | null>(null);

  const resetState = () => {
    setCurrentStep(MockDataGeneratorSteps.AI_DISCLAIMER);
    setRawSchema(null);
    setFakerSchema(null);
    setOutputDocsCount(DEFAULT_OUTPUT_DOCS_COUNT);
    setValidationRules(null);
    setSampleDoc(null);
  };

  const onNext = () => {
    if (currentStep < MockDataGeneratorSteps.GENERATE_DATA) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step, close the modal
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
        {currentStep === MockDataGeneratorSteps.AI_DISCLAIMER && <div></div>}
        {currentStep === MockDataGeneratorSteps.SCHEMA_CONFIRMATION && (
          <div></div>
        )}
        {currentStep === MockDataGeneratorSteps.SCHEMA_EDITOR && <div></div>}
        {currentStep === MockDataGeneratorSteps.DOCUMENT_COUNT && <div></div>}
        {currentStep === MockDataGeneratorSteps.PREVIEW_DATA && <div></div>}
        {currentStep === MockDataGeneratorSteps.GENERATE_DATA && <div></div>}
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
