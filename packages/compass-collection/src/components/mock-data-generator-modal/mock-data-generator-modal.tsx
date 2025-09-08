import React, { useMemo, useEffect, useState } from 'react';
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

import { type FakerMapping, MockDataGeneratorStep } from './types';
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
import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

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
  fakerSchema?: MockDataSchemaResponse;
}

const MockDataGeneratorModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onConfirmSchema,
  onPreviousStep,
  fakerSchema,
}: Props) => {
  const modalBodyContent = useMemo(() => {
    switch (currentStep) {
      case MockDataGeneratorStep.SCHEMA_CONFIRMATION:
        return <SchemaConfirmationScreen />;
      case MockDataGeneratorStep.SCHEMA_EDITOR:
        return fakerSchema === undefined ? (
          <SpinLoaderWithLabel
            className={schemaEditorLoaderStyles}
            progressText="Processing Documents..."
          />
        ) : (
          <FakerSchemaEditor fakerSchema={fakerSchema.content.fields} />
        );
      case MockDataGeneratorStep.DOCUMENT_COUNT:
        return <></>; // TODO: CLOUDP-333856
      case MockDataGeneratorStep.PREVIEW_DATA:
        return <></>; // TODO: CLOUDP-333857
      case MockDataGeneratorStep.GENERATE_DATA:
        return <ScriptScreen />;
    }
  }, [currentStep]);

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
  fakerSchema:
    state.fakerSchemaGeneration.status === 'completed'
      ? state.fakerSchemaGeneration.fakerSchema
      : undefined,
});

const ConnectedMockDataGeneratorModal = connect(mapStateToProps, {
  onClose: mockDataGeneratorModalClosed,
  onNextStep: mockDataGeneratorNextButtonClicked,
  onConfirmSchema: generateFakerMappings,
  onPreviousStep: mockDataGeneratorPreviousButtonClicked,
})(MockDataGeneratorModal);

export default ConnectedMockDataGeneratorModal;
