import React, { useCallback, useMemo } from 'react';
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

import { type MockDataGeneratorStep, MockDataGeneratorSteps } from './types';
import {
  MOCK_DATA_GENERATOR_STEP_TO_NEXT_STEP_MAP,
  StepButtonLabelMap,
} from './constants';
import type { CollectionState } from '../../modules/collection-tab';
import {
  mockDataGeneratorModalClosed,
  mockDataGeneratorNextButtonClicked,
  generateFakerMappings,
  mockDataGeneratorPreviousButtonClicked,
} from '../../modules/collection-tab';

import RawSchemaConfirmationScreen from './raw-schema-confirmation-screen';
import ScriptScreen from './script-screen';
import {
  useTelemetry,
  useTrackOnChange,
} from '@mongodb-js/compass-telemetry/provider';
import {
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';

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
  fakerSchemaGenerationStatus: 'idle' | 'in-progress' | 'completed' | 'error';
}

const MockDataGeneratorModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onConfirmSchema,
  onPreviousStep,
  namespace,
  fakerSchemaGenerationStatus,
}: Props) => {
  const track = useTelemetry();
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const isSampleDocumentPassingEnabled = usePreference(
    'enableGenAISampleDocumentPassing'
  );

  const modalBodyContent = useMemo(() => {
    switch (currentStep) {
      case MockDataGeneratorSteps.SCHEMA_CONFIRMATION:
        return <RawSchemaConfirmationScreen />;
      case MockDataGeneratorSteps.PREVIEW_AND_DOC_COUNT:
        // TODO: CLOUDP-381907 - Create Preview and Doc Count Screen
        return (
          <div data-testid="preview-and-doc-count">Preview and Doc Count</div>
        );
      case MockDataGeneratorSteps.SCRIPT_RESULT:
        return <ScriptScreen />;
    }
  }, [currentStep]);

  // TODO: CLOUDP-381913 - Update Mock Data Generator Analytics Calls
  useTrackOnChange(
    (track) => {
      if (isOpen) {
        track('Mock Data Generator Screen Viewed', {
          screen: currentStep,
        });
      }
    },
    [currentStep, isOpen]
  );

  const isNextButtonDisabled =
    currentStep === MockDataGeneratorSteps.SCHEMA_CONFIRMATION &&
    fakerSchemaGenerationStatus === 'in-progress';

  const handleNextClick = useCallback(() => {
    const nextStep = MOCK_DATA_GENERATOR_STEP_TO_NEXT_STEP_MAP[currentStep];
    track('Mock Data Generator Screen Proceeded', {
      from_screen: currentStep,
      to_screen: nextStep,
    });

    if (currentStep === MockDataGeneratorSteps.SCRIPT_RESULT) {
      onClose();
    } else if (currentStep === MockDataGeneratorSteps.SCHEMA_CONFIRMATION) {
      void onConfirmSchema();
    } else {
      onNextStep();
    }
  }, [currentStep, onConfirmSchema, onNextStep, onClose, track]);

  const shouldShowNamespace =
    currentStep !== MockDataGeneratorSteps.SCRIPT_RESULT;

  const onModalClose = useCallback(() => {
    track('Mock Data Generator Dismissed', {
      screen: currentStep,
      gen_ai_features_enabled: isAIFeatureEnabled,
      send_sample_values_enabled: isSampleDocumentPassingEnabled,
    });
    onClose();
  }, [
    currentStep,
    track,
    onClose,
    isAIFeatureEnabled,
    isSampleDocumentPassingEnabled,
  ]);

  return (
    <Modal
      size="large"
      open={isOpen}
      setOpen={(open) => {
        if (!open) {
          onModalClose();
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
          onClick={onPreviousStep}
          disabled={currentStep === MockDataGeneratorSteps.SCHEMA_CONFIRMATION}
        >
          Back
        </Button>
        <div className={rightButtonsStyles}>
          <Button onClick={onModalClose}>Cancel</Button>
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
  fakerSchemaGenerationStatus: state.fakerSchemaGeneration?.status ?? 'idle',
});

const ConnectedMockDataGeneratorModal = connect(mapStateToProps, {
  onClose: mockDataGeneratorModalClosed,
  onNextStep: mockDataGeneratorNextButtonClicked,
  onConfirmSchema: generateFakerMappings,
  onPreviousStep: mockDataGeneratorPreviousButtonClicked,
})(MockDataGeneratorModal);

export default ConnectedMockDataGeneratorModal;
