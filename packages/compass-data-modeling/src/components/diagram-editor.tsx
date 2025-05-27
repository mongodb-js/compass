import React, { useMemo, useState } from 'react';
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
  palette,
  ErrorSummary,
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
import type { Edit, StaticModel } from '../services/data-model-storage';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import { UUID } from 'bson';
import {
  Diagram,
  DiagramProvider,
  type NodeProps,
  type EdgeProps,
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

const modelPreviewStyles = css({
  minHeight: 0,
});

const editorContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: `0 0 0 2px ${palette.gray.light2}`,
});

const editorContainerApplyContainerStyles = css({
  paddingLeft: 8,
  paddingRight: 8,
  justifyContent: 'flex-end',
  gap: spacing[200],
  display: 'flex',
  width: '100%',
  height: spacing[100],
});

const editorContainerPlaceholderButtonStyles = css({
  paddingLeft: 8,
  paddingRight: 8,
  alignSelf: 'flex-start',
  display: 'flex',
  gap: spacing[200],
  paddingTop: spacing[200],
});

const DiagramEditor: React.FunctionComponent<{
  step: DataModelingState['step'];
  hasUndo: boolean;
  onUndoClick: () => void;
  hasRedo: boolean;
  onRedoClick: () => void;
  model: StaticModel | null;
  editErrors?: string[];
  onRetryClick: () => void;
  onCancelClick: () => void;
  onApplyClick: (edit: Omit<Edit, 'id' | 'timestamp'>) => void;
}> = ({
  step,
  hasUndo,
  onUndoClick,
  hasRedo,
  onRedoClick,
  model,
  editErrors,
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

  const applyPlaceholder =
    (type: 'AddRelationship' | 'RemoveRelationship') => () => {
      let placeholder = {};
      switch (type) {
        case 'AddRelationship':
          placeholder = {
            type: 'AddRelationship',
            relationship: {
              id: new UUID().toString(),
              relationship: [
                {
                  ns: 'db.sourceCollection',
                  cardinality: 'one',
                  fields: ['field1'],
                },
                {
                  ns: 'db.targetCollection',
                  cardinality: 'one',
                  fields: ['field2'],
                },
              ],
              isInferred: false,
            },
          };
          break;
        case 'RemoveRelationship':
          placeholder = {
            type: 'RemoveRelationship',
            relationshipId: new UUID().toString(),
          };
          break;
        default:
          throw new Error(`Unknown placeholder ${placeholder}`);
      }
      setApplyInput(JSON.stringify(placeholder, null, 2));
    };

  const nodes = useMemo<NodeProps[]>(() => {
    if (!model) {
      return [];
    }
    return model.collections.map((coll): NodeProps => {
      return {
        id: coll.ns,
        type: 'collection',
        title: coll.ns,
        fields: Object.entries(coll.jsonSchema.properties || {}).map(
          ([name, field]) => {
            const type = Array.isArray(field.bsonType)
              ? field.bsonType[0]
              : field.bsonType;
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
          x: coll.displayPosition[0],
          y: coll.displayPosition[1],
        },
      };
    });
  }, [model]);

  const edges = useMemo<EdgeProps[]>(() => {
    if (!model) {
      return [];
    }
    return model.relationships.map((relationship) => {
      return {
        id: relationship.id,
        markerStart: relationship.relationship[0].cardinality,
        markerEnd: relationship.relationship[1].cardinality,
        source: relationship.relationship[0].ns,
        target: relationship.relationship[1].ns,
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
        <div className={modelPreviewStyles} data-testid="model-preview">
          {nodes && (
            <Diagram title="Schema Preview" edges={edges} nodes={nodes} />
          )}
        </div>
        <div className={editorContainerStyles} data-testid="apply-editor">
          <div className={editorContainerPlaceholderButtonStyles}>
            <Button
              onClick={applyPlaceholder('AddRelationship')}
              data-testid="placeholder-addrelationship-button"
            >
              Add relationship
            </Button>
            <Button
              onClick={applyPlaceholder('RemoveRelationship')}
              data-testid="placeholder-removerelationship-button"
            >
              Remove relationship
            </Button>
          </div>
          <div>
            <CodemirrorMultilineEditor
              language="json"
              text={applyInput}
              onChangeText={setApplyInput}
              maxLines={10}
            ></CodemirrorMultilineEditor>
          </div>
          <div className={editorContainerApplyContainerStyles}>
            {editErrors && <ErrorSummary errors={editErrors} />}
            <Button
              onClick={() => {
                onApplyClick(JSON.parse(applyInput));
              }}
              data-testid="apply-button"
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
      editErrors: diagram?.editErrors,
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
