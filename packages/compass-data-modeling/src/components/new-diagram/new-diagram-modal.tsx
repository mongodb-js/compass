import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import type { GenerateDiagramWizardState } from '../../store/generate-diagram-wizard';
import {
  cancelCreateNewDiagram,
  confirmSelectedCollections,
  gotoStep,
} from '../../store/generate-diagram-wizard';
import { Modal, useTranslation } from '@mongodb-js/compass-components';
import SetupDiagramStep from './setup-diagram-step';
import SelectCollectionsStep from './select-collections-step';
import { selectIsAnalysisInProgress } from '../../store/analysis-process';
import { ModalStepContainer } from '../model-step-container';
import { areSamplingOptionsValid } from '../../store/sampling-options';
import DiagramSettingsStep from './new-diagram-settings-step';

type NewDiagramModalProps = {
  isOpen: boolean;
  currentStep: GenerateDiagramWizardState['step'];
  isGotoCollectionsStepDisabled: boolean;
  isGenerateDiagramDisabled: boolean;
  numSelectedCollections: number;
  numTotalCollections: number;
  selectedDatabaseName: string;
  onCancel: () => void;
  onStep: (
    step: 'SETUP_DIAGRAM' | 'SELECT_COLLECTIONS' | 'DIAGRAM_SETTINGS'
  ) => void;
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
  const t = useTranslation();
  const formStepProps = useMemo(() => {
    const collectionsSelectedFooter = numTotalCollections > 0 && (
      <>
        <strong>{numSelectedCollections}</strong>/
        <strong>{numTotalCollections}</strong>{' '}
        {numTotalCollections === 1
          ? t(
              'dataModeling.newDiagram.collectionsSelected.one',
              'total collection selected.'
            )
          : t(
              'dataModeling.newDiagram.collectionsSelected.other',
              'total collections selected.'
            )}
      </>
    );
    switch (currentStep) {
      case 'SETUP_DIAGRAM':
        return {
          title: t('dataModeling.newDiagram.setupTitle', 'New diagram setup'),
          onNextClick: () => onStep('SELECT_COLLECTIONS'),
          onPreviousClick: onCancel,
          nextLabel: t('dataModeling.newDiagram.next', 'Next'),
          previousLabel: t('dataModeling.newDiagram.cancel', 'Cancel'),
          isNextDisabled: isGotoCollectionsStepDisabled,
          step: currentStep,
        };
      case 'SELECT_COLLECTIONS':
        return {
          title: t(
            'dataModeling.newDiagram.selectCollectionsTitle',
            'Select collections for {database}',
            { database: selectedDatabaseName }
          ),
          description: t(
            'dataModeling.newDiagram.selectCollectionsDescription',
            'These collections will be included in your generated diagram.'
          ),
          onNextClick: () => onStep('DIAGRAM_SETTINGS'),
          onPreviousClick: () => onStep('SETUP_DIAGRAM'),
          nextLabel: t('dataModeling.newDiagram.next', 'Next'),
          previousLabel: t('dataModeling.newDiagram.back', 'Back'),
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: collectionsSelectedFooter,
        };
      case 'DIAGRAM_SETTINGS':
        return {
          title: t('dataModeling.newDiagram.settingsTitle', 'Diagram settings'),
          onNextClick: onGenerate,
          onPreviousClick: () => onStep('SELECT_COLLECTIONS'),
          nextLabel: t('dataModeling.newDiagram.generate', 'Generate'),
          previousLabel: t('dataModeling.newDiagram.back', 'Back'),
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: collectionsSelectedFooter,
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
    t,
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
        ) : currentStep === 'DIAGRAM_SETTINGS' ? (
          <DiagramSettingsStep />
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
        !areSamplingOptionsValid(formFields.samplingOptions.value) ||
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
