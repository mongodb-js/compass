import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import {
  applyEdit,
  getCurrentDiagramFromState,
  selectCurrentModel,
} from '../store/diagram';
import {
  Banner,
  CancelLoader,
  WorkspaceContainer,
  css,
  spacing,
  Button,
  palette,
  ErrorSummary,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
import {
  Diagram,
  type NodeProps,
  type EdgeProps,
  useDiagram,
  applyLayout,
} from '@mongodb-js/diagramming';
import type { Edit, StaticModel } from '../services/data-model-storage';
import { UUID } from 'bson';
import DiagramEditorToolbar from './diagram-editor-toolbar';
import ExportDiagramModal from './export-diagram-modal';

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
  padding: spacing[200],
  justifyContent: 'flex-end',
  gap: spacing[200],
  display: 'flex',
  width: '100%',
  alignItems: 'center',
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
  diagramLabel: string;
  step: DataModelingState['step'];
  model: StaticModel | null;
  editErrors?: string[];
  onRetryClick: () => void;
  onCancelClick: () => void;
  onApplyClick: (edit: Omit<Edit, 'id' | 'timestamp'>) => void;
}> = ({
  diagramLabel,
  step,
  model,
  editErrors,
  onRetryClick,
  onCancelClick,
  onApplyClick,
}) => {
  const isDarkMode = useDarkMode();
  const diagramContainerRef = useRef<HTMLDivElement | null>(null);
  const diagram = useDiagram();
  const [nodes, setNodes] = useState<NodeProps[]>([]);

  const setDiagramContainerRef = useCallback(
    (ref: HTMLDivElement | null) => {
      if (ref) {
        // For debugging purposes, we attach the diagram to the ref.
        (ref as any)._diagram = diagram;
      }
      diagramContainerRef.current = ref;
    },
    [diagram]
  );

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
                  cardinality: 1,
                  fields: ['field1'],
                },
                {
                  ns: 'db.targetCollection',
                  cardinality: 1,
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
          throw new Error(`Unknown placeholder ${type}`);
      }
      setApplyInput(JSON.stringify(placeholder, null, 2));
    };

  const edges = useMemo(() => {
    return (model?.relationships ?? []).map((relationship): EdgeProps => {
      const [source, target] = relationship.relationship;
      return {
        id: relationship.id,
        source: source.ns,
        target: target.ns,
        markerStart: source.cardinality === 1 ? 'one' : 'many',
        markerEnd: target.cardinality === 1 ? 'one' : 'many',
      };
    });
  }, [model?.relationships]);

  const applyInitialLayout = useCallback(
    async (storedNodes: NodeProps[]) => {
      console.log('INITIAL STATE: applying layout');
      try {
        const { nodes: positionedNodes } = await applyLayout(
          storedNodes,
          edges,
          'STAR'
        );
        // TODO: save the new positions to the model
        setNodes(positionedNodes);
      } catch (err) {
        console.error('Error applying layout:', err);
      }
    },
    [setNodes]
  );

  useEffect(() => {
    const storedNodes = (model?.collections ?? []).map(
      (coll): NodeProps => ({
        id: coll.ns,
        type: 'collection',
        position: {
          x: coll.displayPosition[0],
          y: coll.displayPosition[1],
        },
        title: coll.ns,
        fields: Object.entries(coll.jsonSchema.properties ?? {}).map(
          ([name, field]) => {
            const type =
              field.bsonType === undefined
                ? 'Unknown'
                : typeof field.bsonType === 'string'
                ? field.bsonType
                : // TODO: Show possible types of the field
                  field.bsonType[0];
            return {
              name,
              type,
              glyphs: type === 'objectId' ? ['key'] : [],
            };
          }
        ),
      })
    );
    const isInitialState = storedNodes.every(
      (node) => node.position.x === -1 && node.position.y === -1
    );
    if (isInitialState) {
      void applyInitialLayout(storedNodes);
      return;
    }
    setNodes(storedNodes);
  }, [model?.collections]);

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
        ref={setDiagramContainerRef}
        className={modelPreviewContainerStyles}
        data-testid="diagram-editor-container"
      >
        <div className={modelPreviewStyles} data-testid="model-preview">
          <Diagram
            isDarkMode={isDarkMode}
            title={diagramLabel}
            edges={edges}
            nodes={nodes}
            onEdgeClick={(evt, edge) => {
              setApplyInput(
                JSON.stringify(
                  {
                    type: 'RemoveRelationship',
                    relationshipId: edge.id,
                  },
                  null,
                  2
                )
              );
            }}
          />
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
    <WorkspaceContainer toolbar={<DiagramEditorToolbar />}>
      {content}
      <ExportDiagramModal />
    </WorkspaceContainer>
  );
};

export default connect(
  (state: DataModelingState) => {
    const { diagram, step } = state;
    return {
      step: step,
      model: diagram
        ? selectCurrentModel(getCurrentDiagramFromState(state))
        : null,
      editErrors: diagram?.editErrors,
      diagramLabel: diagram?.name || 'Schema Preview',
    };
  },
  {
    onRetryClick: retryAnalysis,
    onCancelClick: cancelAnalysis,
    onApplyClick: applyEdit,
  }
)(DiagramEditor);
