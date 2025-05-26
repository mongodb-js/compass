import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
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
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
import {
  Diagram,
  DiagramProvider,
  type NodeProps,
} from '@mongodb-js/diagramming';

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
  const nodes = useMemo(() => {
    return (model as any).collections.map((coll: any): NodeProps => {
      return {
        id: coll.ns,
        type: 'collection',
        title: coll.ns,
        fields: Object.entries(coll.jsonSchema.properties).map(
          ([name, field]) => {
            const type =
              typeof field.bsonType === 'string'
                ? field.bsonType
                : field.bsonType[0];
            return {
              name: name,
              type,
              glyphs: type === 'objectId' ? ['key'] : [],
            };
          }
        ),
        measured: {
          width: 100,
          height: 200,
        },
        position: {
          // TODO: replace with actual positions
          x: Math.floor(Math.random() * 1000),
          y: Math.floor(Math.random() * 1000),
        },
      };
    });
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
      <div
        className={modelPreviewContainerStyles}
        data-testid="diagram-editor-container"
      >
        <Diagram title="Schema Preview" edges={[]} nodes={nodes} />
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
      <DiagramProvider>{content}</DiagramProvider>
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
