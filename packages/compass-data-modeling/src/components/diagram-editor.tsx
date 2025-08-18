import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect } from 'react-redux';
import type { DataModelingState } from '../store/reducer';
import {
  moveCollection,
  selectCollection,
  selectRelationship,
  selectBackground,
  type DiagramState,
  selectCurrentModelFromState,
  createNewRelationship,
  addCollection,
} from '../store/diagram';
import {
  Banner,
  CancelLoader,
  WorkspaceContainer,
  css,
  spacing,
  Button,
  useDarkMode,
  useDrawerActions,
  useDrawerState,
  rafraf,
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
import {
  Diagram,
  type NodeProps,
  type EdgeProps,
  useDiagram,
} from '@mongodb-js/diagramming';
import type { StaticModel } from '../services/data-model-storage';
import DiagramEditorToolbar from './diagram-editor-toolbar';
import ExportDiagramModal from './export-diagram-modal';
import { DATA_MODELING_DRAWER_ID } from './drawer/diagram-editor-side-panel';
import {
  collectionToDiagramNode,
  getSelectedFields,
  relationshipToDiagramEdge,
} from '../utils/nodes-and-edges';

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

  /** reactflow handles this normally, but there is a `* { userSelect: 'text' }` in this project,
   *  which overrides inherited userSelect */
  ['.connectablestart']: {
    userSelect: 'none',
  },
});

type SelectedItems = NonNullable<DiagramState>['selectedItems'];

const DiagramContent: React.FunctionComponent<{
  diagramLabel: string;
  model: StaticModel | null;
  isInRelationshipDrawingMode: boolean;
  editErrors?: string[];
  newCollection?: string;
  onMoveCollection: (ns: string, newPosition: [number, number]) => void;
  onCollectionSelect: (namespace: string) => void;
  onRelationshipSelect: (rId: string) => void;
  onDiagramBackgroundClicked: () => void;
  selectedItems: SelectedItems;
  onCreateNewRelationship: (source: string, target: string) => void;
  onRelationshipDrawn: () => void;
}> = ({
  diagramLabel,
  model,
  isInRelationshipDrawingMode,
  newCollection,
  onMoveCollection,
  onCollectionSelect,
  onRelationshipSelect,
  onDiagramBackgroundClicked,
  onCreateNewRelationship,
  onRelationshipDrawn,
  selectedItems,
}) => {
  const isDarkMode = useDarkMode();
  const diagram = useRef(useDiagram());
  const { openDrawer } = useDrawerActions();
  const { isOpen: isDrawerOpen } = useDrawerState();

  const setDiagramContainerRef = useCallback((ref: HTMLDivElement | null) => {
    if (ref) {
      // For debugging purposes, we attach the diagram to the ref.
      (ref as any)._diagram = diagram.current;
    }
  }, []);

  const edges = useMemo<EdgeProps[]>(() => {
    return (model?.relationships ?? []).map((relationship) => {
      const selected =
        !!selectedItems &&
        selectedItems.type === 'relationship' &&
        selectedItems.id === relationship.id;
      return relationshipToDiagramEdge(relationship, selected);
    });
  }, [model?.relationships, selectedItems]);

  const nodes = useMemo<NodeProps[]>(() => {
    const selectedFields = getSelectedFields(
      selectedItems,
      model?.relationships
    );
    return (model?.collections ?? []).map((coll) => {
      const selected =
        !!selectedItems &&
        selectedItems.type === 'collection' &&
        selectedItems.id === coll.ns;
      return collectionToDiagramNode(coll, {
        selectedFields,
        selected,
        isInRelationshipDrawingMode,
      });
    });
  }, [
    model?.collections,
    model?.relationships,
    selectedItems,
    isInRelationshipDrawingMode,
  ]);

  // Fit to view on initial mount
  useEffect(() => {
    // Schedule the fitView call to make sure that diagramming package had a
    // chance to set initial nodes, edges state
    // TODO: react-flow documentation suggests that we should be able to do this
    // without unrelyable scheduling by calling the fitView after initial state
    // is set, but for this we will need to make some changes to the diagramming
    // package first
    return rafraf(() => {
      void diagram.current.fitView();
    });
  }, []);

  // Center on a new collection when it is added
  const previouslyOpenedDrawer = useRef<boolean>(false);
  useEffect(() => {
    if (newCollection) {
      const node = nodes.find((n) => n.id === newCollection);
      if (node) {
        const zoom = diagram.current.getViewport().zoom;
        const drawerOffset = previouslyOpenedDrawer.current ? 0 : 240;
        const newNodeWidth = 244;
        const newNodeHeight = 64;
        return rafraf(() => {
          void diagram.current.setCenter(
            ((node.position.x + newNodeWidth / 2) * zoom + drawerOffset) / zoom,
            node.position.y + newNodeHeight / 2,
            {
              duration: 500,
              zoom,
            }
          );
        });
      }
    }
    previouslyOpenedDrawer.current = !!isDrawerOpen;
  }, [newCollection, nodes, isDrawerOpen]);

  const handleNodesConnect = useCallback(
    (source: string, target: string) => {
      onCreateNewRelationship(source, target);
      onRelationshipDrawn();
    },
    [onRelationshipDrawn, onCreateNewRelationship]
  );

  return (
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
          // With threshold too low clicking sometimes gets confused with
          // dragging
          nodeDragThreshold={5}
          onNodeClick={(_evt, node) => {
            if (node.type !== 'collection') {
              return;
            }
            onCollectionSelect(node.id);
            openDrawer(DATA_MODELING_DRAWER_ID);
          }}
          onPaneClick={onDiagramBackgroundClicked}
          onEdgeClick={(_evt, edge) => {
            onRelationshipSelect(edge.id);
            openDrawer(DATA_MODELING_DRAWER_ID);
          }}
          fitViewOptions={{
            maxZoom: 1,
            minZoom: 0.25,
          }}
          onNodeDragStop={(evt, node) => {
            onMoveCollection(node.id, [node.position.x, node.position.y]);
          }}
          onConnect={({ source, target }) => {
            handleNodesConnect(source, target);
          }}
        />
      </div>
    </div>
  );
};

const ConnectedDiagramContent = connect(
  (state: DataModelingState) => {
    const { diagram } = state;
    return {
      model: diagram ? selectCurrentModelFromState(state) : null,
      diagramLabel: diagram?.name || 'Schema Preview',
      selectedItems: state.diagram?.selectedItems ?? null,
      newCollection: diagram?.draftCollection,
    };
  },
  {
    onMoveCollection: moveCollection,
    onCollectionSelect: selectCollection,
    onRelationshipSelect: selectRelationship,
    onDiagramBackgroundClicked: selectBackground,
    onCreateNewRelationship: createNewRelationship,
  }
)(DiagramContent);

const DiagramEditor: React.FunctionComponent<{
  step: DataModelingState['step'];
  diagramId?: string;
  onRetryClick: () => void;
  onCancelClick: () => void;
  onAddCollectionClick: () => void;
}> = ({
  step,
  diagramId,
  onRetryClick,
  onCancelClick,
  onAddCollectionClick,
}) => {
  const { openDrawer } = useDrawerActions();
  let content;

  const [isInRelationshipDrawingMode, setIsInRelationshipDrawingMode] =
    useState(false);

  const handleRelationshipDrawingToggle = useCallback(() => {
    setIsInRelationshipDrawingMode((prev) => !prev);
  }, []);

  const onRelationshipDrawn = useCallback(() => {
    setIsInRelationshipDrawingMode(false);
  }, []);

  const handleAddCollectionClick = useCallback(() => {
    onAddCollectionClick();
    openDrawer(DATA_MODELING_DRAWER_ID);
  }, [openDrawer, onAddCollectionClick]);

  if (step === 'NO_DIAGRAM_SELECTED') {
    return null;
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

  if (step === 'EDITING' && diagramId) {
    content = (
      <ConnectedDiagramContent
        key={diagramId}
        isInRelationshipDrawingMode={isInRelationshipDrawingMode}
        onRelationshipDrawn={onRelationshipDrawn}
      ></ConnectedDiagramContent>
    );
  }

  return (
    <WorkspaceContainer
      toolbar={
        <DiagramEditorToolbar
          onRelationshipDrawingToggle={handleRelationshipDrawingToggle}
          isInRelationshipDrawingMode={isInRelationshipDrawingMode}
          onAddCollectionClick={handleAddCollectionClick}
        />
      }
    >
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
      editErrors: diagram?.editErrors,
      diagramId: diagram?.id,
    };
  },
  {
    onRetryClick: retryAnalysis,
    onCancelClick: cancelAnalysis,
    onAddCollectionClick: addCollection,
  }
)(DiagramEditor);
