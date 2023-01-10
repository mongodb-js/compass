import React from 'react';
import {
  Modal,
  ModalBody,
  Body,
  css,
  spacing,
  palette,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';

import type { RootState } from '../../modules';
import { focusModeDisabled } from '../../modules/focus-mode';
import { StageEditorArea } from './stage-editor-area';
import { StagePreviewArea } from './stage-preview-area';

const modalStyles = css({
  '[role="dialog"]': {
    width: '100%',
  },
});

const containerStyles = css({
  display: 'grid',
  gridTemplateRows: 'min-content 1fr',
  gridTemplateColumns: '1fr',
  overflow: 'hidden',
  padding: spacing[5],
});

const headerStyles = css({
  borderBottom: `1px solid ${palette.gray.light2}`,
});

const bodyStyles = css({
  display: 'flex',
  gap: spacing[2],
  height: '100%',
  overflow: 'hidden',
});

const previewAreaStyles = css({
  width: '25%',
  paddingTop: spacing[4],
});

const editorAreaStyles = css({
  width: '50%',
  paddingTop: spacing[4],
  backgroundColor: palette.gray.light3,
});

type StagePreview = {
  isLoading: boolean;
  documents: Document[] | null;
};

type FocusModeProps = {
  isModalOpen: boolean;
  stageInput: StagePreview | null;
  stageIndex: number;
  stageOperator: string | null;
  stageOutput: StagePreview | null;
  onCloseModal: () => void;
};

export const FocusMode: React.FunctionComponent<FocusModeProps> = ({
  isModalOpen,
  stageInput,
  stageIndex,
  stageOperator,
  stageOutput,
  onCloseModal,
}) => {
  if (!isModalOpen || !stageOutput || !stageInput) {
    return null;
  }

  return (
    <Modal
      className={modalStyles}
      size={'large'}
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid={`focus-mode-modal-${stageIndex}`}
    >
      <ModalBody className={containerStyles}>
        <div className={headerStyles}>
          <Body>Focus Mode (in progress feature)</Body>
        </div>
        <div className={bodyStyles}>
          <div className={previewAreaStyles}>
            <StagePreviewArea
              title='Stage Input'
              isLoading={stageInput.isLoading}
              documents={stageInput.documents} />
          </div>
          <div className={editorAreaStyles}>
            <StageEditorArea
              index={stageIndex}
              stageOperator={stageOperator} />
          </div>
          <div className={previewAreaStyles}>
            <StagePreviewArea
              title='Stage Output'
              isLoading={stageOutput.isLoading}
              documents={stageOutput.documents} /> 
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

const mapState = ({
  focusMode: { isEnabled, stageIndex },
  inputDocuments,
  pipelineBuilder: {
    stageEditor: {
      stages,
    }
  }
}: RootState) => {
  const currentStage = stages[stageIndex];
  const previousStage = stages[stageIndex - 1];

  const stageInput: StagePreview = previousStage
    ? {
      isLoading: previousStage.loading,
      documents: previousStage.previewDocs,
    } : {
      isLoading: inputDocuments.isLoading,
      documents: inputDocuments.documents,
    };

  const stageOutput: StagePreview | null = currentStage
    ? {
      isLoading: currentStage.loading,
      documents: currentStage.previewDocs,
    } : null;

  return {
    isModalOpen: isEnabled,
    stageInput,
    stageIndex,
    stageOperator: currentStage?.stageOperator,
    stageOutput,
  };
};

const mapDispatch = {
  onCloseModal: focusModeDisabled
};
export default connect(mapState, mapDispatch)(FocusMode);
