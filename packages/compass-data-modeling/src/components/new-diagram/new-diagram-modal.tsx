import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import type { GenerateDiagramWizardState } from '../../store/generate-diagram-wizard';
import {
  cancelCreateNewDiagram,
  confirmSelectedCollections,
  gotoStep,
} from '../../store/generate-diagram-wizard';
import { Modal } from '@mongodb-js/compass-components';
import SetupDiagramStep from './setup-diagram-step';
import SelectCollectionsStep from './select-collections-step';
import { selectIsAnalysisInProgress } from '../../store/analysis-process';
import { ModalStepContainer } from '../model-step-container';

type NewDiagramModalProps = {
  isOpen: boolean;
  currentStep: GenerateDiagramWizardState['step'];
  isGotoCollectionsStepDisabled: boolean;
  isGenerateDiagramDisabled: boolean;
  numSelectedCollections: number;
  numTotalCollections: number;
  selectedDatabaseName: string;
  onCancel: () => void;
  onStep: (step: 'SETUP_DIAGRAM' | 'SELECT_COLLECTIONS') => void;
  onGenerate: () => void;
};

const NewDiagramModal: React.FunctionComponent<NewDiagramModalProps> = ({
  isOpen,
  currentStep,
  isGenerateDiagramDisabled,
  isGotoCollectionsStepDisabled,
  numSelectedCollections,
  numTotalCollections,
  selectedDatabaseName,
  onCancel,
  onStep,
  onGenerate,
}) => {
  const formStepProps = useMemo(() => {
    switch (currentStep) {
      case 'SETUP_DIAGRAM':
        return {
          title: 'New diagram setup',
          onNextClick: () => onStep('SELECT_COLLECTIONS'),
          onPreviousClick: onCancel,
          nextLabel: 'Next',
          previousLabel: 'Cancel',
          isNextDisabled: isGotoCollectionsStepDisabled,
          step: currentStep,
        };
      case 'SELECT_COLLECTIONS':
        return {
          title: `Select collections for ${selectedDatabaseName}`,
          description:
            'These collections will be included in your generated diagram.',
          onNextClick: onGenerate,
          onPreviousClick: () => onStep('SETUP_DIAGRAM'),
          nextLabel: 'Generate',
          previousLabel: 'Back',
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: numTotalCollections > 0 && (
            <>
              <strong>{numSelectedCollections}</strong>/
              <strong>{numTotalCollections}</strong> total{' '}
              {numTotalCollections === 1 ? 'collection' : 'collections'}{' '}
              selected.
            </>
          ),
        };
      default:
        throw new Error('Unknown diagram generation step');
    }
  }, [
    currentStep,
    isGotoCollectionsStepDisabled,
    isGenerateDiagramDisabled,
    numSelectedCollections,
    numTotalCollections,
    selectedDatabaseName,
    onCancel,
    onGenerate,
    onStep,
  ]);

  return (
    <Modal
      open={isOpen}
      data-testid="new-diagram-modal"
      setOpen={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <ModalStepContainer {...formStepProps}>
        {currentStep === 'SETUP_DIAGRAM' ? (
          <SetupDiagramStep />
        ) : currentStep === 'SELECT_COLLECTIONS' ? (
          <SelectCollectionsStep />
        ) : null}
      </ModalStepContainer>
    </Modal>
  );
};

export default connect(
  (state: DataModelingState) => {
    const {
      inProgress: isOpen,
      step: currentStep,
      formFields,
      databaseCollections,
      samplingOptions,
    } = state.generateDiagramWizard;

    return {
      isOpen,
      currentStep,
      isGotoCollectionsStepDisabled:
        !formFields.diagramName.value ||
        Boolean(formFields.diagramName.error) ||
        !formFields.selectedConnection.value ||
        !formFields.selectedDatabase.value,
      isGenerateDiagramDisabled:
        !formFields.selectedCollections.value ||
        formFields.selectedCollections.value.length === 0 ||
        ((samplingOptions?.sampleSize === undefined ||
          samplingOptions?.sampleSize <= 0) &&
          samplingOptions.allDocuments === undefined) ||
        selectIsAnalysisInProgress(state),
      numSelectedCollections: formFields.selectedCollections.value?.length || 0,
      numTotalCollections: databaseCollections?.length || 0,
      selectedDatabaseName: formFields.selectedDatabase.value || '',
    };
  },
  {
    onCancel: cancelCreateNewDiagram,
    onStep: gotoStep,
    onGenerate: confirmSelectedCollections,
  }
)(NewDiagramModal);
