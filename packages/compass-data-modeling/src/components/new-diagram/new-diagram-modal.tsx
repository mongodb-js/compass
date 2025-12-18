import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../../store/reducer';
import type { GenerateDiagramWizardState } from '../../store/generate-diagram-wizard';
import {
  cancelCreateNewDiagram,
  confirmSelectedCollections,
  gotoStep,
} from '../../store/generate-diagram-wizard';
import {
  Body,
  Button,
  css,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  spacing,
  SpinLoader,
} from '@mongodb-js/compass-components';
import SetupDiagramStep from './setup-diagram-step';
import SelectCollectionsStep from './select-collections-step';

const footerStyles = css({
  flexDirection: 'row',
  alignItems: 'center',
});
const footerTextStyles = css({ marginRight: 'auto' });
const footerActionsStyles = css({ display: 'flex', gap: spacing[200] });

const FormStepContainer: React.FunctionComponent<{
  title: string;
  description?: string;
  onNextClick: () => void;
  onPreviousClick: () => void;
  isNextDisabled: boolean;
  nextLabel: string;
  previousLabel: string;
  step: string;
  footerText?: React.ReactNode;
}> = ({
  title,
  description,
  onPreviousClick,
  onNextClick,
  isNextDisabled,
  nextLabel,
  previousLabel,
  children,
  step,
  footerText,
}) => {
  return (
    <>
      <ModalHeader title={title} subtitle={description}></ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNextClick();
          }}
        >
          {children}
        </form>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Body className={footerTextStyles}>{footerText}</Body>
        <div className={footerActionsStyles}>
          <Button onClick={onPreviousClick} key={`${step}-previous`}>
            {previousLabel}
          </Button>
          <Button
            onClick={onNextClick}
            disabled={isNextDisabled}
            data-testid="new-diagram-confirm-button"
            variant="primary"
            loadingIndicator={<SpinLoader />}
            key={`${step}-next`}
          >
            {nextLabel}
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};

type NewDiagramModalProps = {
  isOpen: boolean;
  currentStep: GenerateDiagramWizardState['step'];
  isGotoCollectionsStepDisabled: boolean;
  isGenerateDiagramDisabled: boolean;
  numSelectedCollections: number;
  numTotalCollections: number;
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
          title: 'Select collections',
          description:
            'Choose the collections you want to include in your diagram.',
          onNextClick: onGenerate,
          onPreviousClick: () => onStep('SETUP_DIAGRAM'),
          nextLabel: 'Generate',
          previousLabel: 'Back',
          isNextDisabled: isGenerateDiagramDisabled,
          step: currentStep,
          footerText: (
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
    onCancel,
    isGotoCollectionsStepDisabled,
    onGenerate,
    isGenerateDiagramDisabled,
    numSelectedCollections,
    numTotalCollections,
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
      <FormStepContainer {...formStepProps}>
        {currentStep === 'SETUP_DIAGRAM' ? (
          <SetupDiagramStep />
        ) : currentStep === 'SELECT_COLLECTIONS' ? (
          <SelectCollectionsStep />
        ) : null}
      </FormStepContainer>
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
        state.analysisProgress.analysisProcessStatus === 'in-progress',
      numSelectedCollections: formFields.selectedCollections.value?.length || 0,
      numTotalCollections: databaseCollections?.length || 0,
    };
  },
  {
    onCancel: cancelCreateNewDiagram,
    onStep: gotoStep,
    onGenerate: confirmSelectedCollections,
  }
)(NewDiagramModal);
