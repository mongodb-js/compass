import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import {
  applyEdit,
  getCurrentDiagramFromState,
  redoEdit,
  selectCurrentModel,
  undoEdit,
} from '../store/diagram';
import {
  Banner,
  Icon,
  IconButton,
  CancelLoader,
  WorkspaceContainer,
  css,
  spacing,
  Button,
  palette,
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';

const loadingContainerStyles = css({
  width: '100%',
  paddingTop: spacing[1800] * 3,
});

const loaderStyles = css({
  margin: '0 auto',
});

const bannerStyles = css({
  margin: spacing[200],
  '& > div': {
    display: 'flex',
    alignItems: 'center',
  },
});

const bannerButtonStyles = css({
  marginLeft: 'auto',
});

const ErrorBannerWithRetry: React.FunctionComponent<{
  onRetryClick: () => void;
}> = ({ children, onRetryClick }) => {
  return (
    <Banner variant="danger" className={bannerStyles}>
      <div>{children}</div>
      <Button
        className={bannerButtonStyles}
        size="xsmall"
        onClick={onRetryClick}
      >
        Retry
      </Button>
    </Banner>
  );
};

const modelPreviewContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '100%',
  gridTemplateRows: '1fr auto',
  gap: 2,
  height: '100%',
});

const modelPreviewStyles = css({
  minHeight: 0,
});

const editorContainerStyles = css({
  height: 160 + 34 + 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: `0 0 0 2px ${palette.gray.light2}`,
});

const editorContainerApplyButtonStyles = css({
  paddingLeft: 8,
  paddingRight: 8,
  alignSelf: 'flex-end',
});

const DiagramEditor: React.FunctionComponent<{
  step: DataModelingState['step'];
  hasUndo: boolean;
  onUndoClick: () => void;
  hasRedo: boolean;
  onRedoClick: () => void;
  model: unknown;
  onRetryClick: () => void;
  onCancelClick: () => void;
  // TODO
  onApplyClick: (edit: unknown) => void;
}> = ({
  step,
  hasUndo,
  onUndoClick,
  hasRedo,
  onRedoClick,
  model,
  onRetryClick,
  onCancelClick,
  onApplyClick,
}) => {
  const [applyInput, setApplyInput] = useState('{}');
  const isEditValid = useMemo(() => {
    try {
      JSON.parse(applyInput);
      return true;
    } catch {
      return false;
    }
  }, [applyInput]);

  const modelStr = useMemo(() => {
    return JSON.stringify(model, null, 2);
  }, [model]);

  let content;

  if (step === 'NO_DIAGRAM_SELECTED') {
    throw new Error('Unexpected');
  }

  if (step === 'ANALYZING') {
    content = (
      <div className={loadingContainerStyles}>
        <CancelLoader
          className={loaderStyles}
          progressText="Analyzing …"
          cancelText="Cancel"
          onCancel={onCancelClick}
        ></CancelLoader>
      </div>
    );
  }

  if (step === 'ANALYSIS_FAILED') {
    content = (
      <ErrorBannerWithRetry onRetryClick={onRetryClick}>
        Analysis canceled
      </ErrorBannerWithRetry>
    );
  }

  if (step === 'ANALYSIS_CANCELED') {
    content = (
      <ErrorBannerWithRetry onRetryClick={onRetryClick}>
        Analysis canceled
      </ErrorBannerWithRetry>
    );
  }

  if (step === 'EDITING') {
    content = (
      <div className={modelPreviewContainerStyles}>
        <div className={modelPreviewStyles}>
          <CodemirrorMultilineEditor
            language="json"
            text={modelStr}
            readOnly
            initialJSONFoldAll={false}
          ></CodemirrorMultilineEditor>
        </div>
        <div className={editorContainerStyles}>
          <div>
            <CodemirrorMultilineEditor
              language="json"
              text={applyInput}
              onChangeText={setApplyInput}
              maxLines={10}
            ></CodemirrorMultilineEditor>
          </div>
          <div className={editorContainerApplyButtonStyles}>
            <Button
              onClick={() => {
                onApplyClick(JSON.parse(applyInput));
              }}
              disabled={!isEditValid}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContainer
      toolbar={() => {
        if (step !== 'EDITING') {
          return null;
        }

        return (
          <>
            <IconButton
              aria-label="Undo"
              disabled={!hasUndo}
              onClick={onUndoClick}
            >
              <Icon glyph="Undo"></Icon>
            </IconButton>
            <IconButton
              aria-label="Redo"
              disabled={!hasRedo}
              onClick={onRedoClick}
            >
              <Icon glyph="Redo"></Icon>
            </IconButton>
          </>
        );
      }}
    >
      {content}
    </WorkspaceContainer>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram, step } = state;
    return {
      step: step,
      hasUndo: (diagram?.edits.prev.length ?? 0) > 0,
      hasRedo: (diagram?.edits.next.length ?? 0) > 0,
      model: diagram
        ? selectCurrentModel(getCurrentDiagramFromState(state))
        : null,
    };
  },
  {
    onUndoClick: undoEdit,
    onRedoClick: redoEdit,
    onRetryClick: retryAnalysis,
    onCancelClick: cancelAnalysis,
    onApplyClick: applyEdit,
  }
)(DiagramEditor);
