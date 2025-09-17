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
  addNewFieldToCollection,
  moveCollection,
  selectCollection,
  selectRelationship,
  selectBackground,
  type DiagramState,
  selectCurrentModelFromState,
  createNewRelationship,
  addCollection,
  selectField,
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
import type { FieldPath, StaticModel } from '../services/data-model-storage';
import DiagramEditorToolbar from './diagram-editor-toolbar';
import ExportDiagramModal from './export-diagram-modal';
import { DATA_MODELING_DRAWER_ID } from './drawer/diagram-editor-side-panel';
import {
  collectionToDiagramNode,
  getHighlightedFields,
  relationshipToDiagramEdge,
} from '../utils/nodes-and-edges';
import toNS from 'mongodb-ns';

const loadingContainerStyles = css({
  width: '100%',
  paddingTop: spacing[1800] * 3,
});

const loaderStyles = css({
  margin: '0 auto',
});

const errorBannerStyles = css({
  margin: spacing[200],
  '& > div': {
    display: 'flex',
    alignItems: 'center',
  },
});

const dataInfoBannerStyles = css({
  margin: spacing[400],
  position: 'absolute',
  zIndex: 100,

  h4: {
    marginTop: 0,
    marginBottom: 0,
  },
});

const bannerButtonStyles = css({
  marginLeft: 'auto',
});

const ErrorBannerWithRetry: React.FunctionComponent<{
  onRetryClick: () => void;
}> = ({ children, onRetryClick }) => {
  return (
    <Banner variant="danger" className={errorBannerStyles}>
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

const ZOOM_OPTIONS = {
  maxZoom: 1,
  minZoom: 0.25,
};

type SelectedItems = NonNullable<DiagramState>['selectedItems'];

const DiagramContent: React.FunctionComponent<{
  diagramLabel: string;
  database: string | null;
  isNewlyCreatedDiagram?: boolean;
  model: StaticModel | null;
  isInRelationshipDrawingMode: boolean;
  editErrors?: string[];
  newCollection?: string;
  onAddNewFieldToCollection: (ns: string) => void;
  onMoveCollection: (ns: string, newPosition: [number, number]) => void;
  onCollectionSelect: (namespace: string) => void;
  onRelationshipSelect: (rId: string) => void;
  onFieldSelect: (namespace: string, fieldPath: FieldPath) => void;
  onDiagramBackgroundClicked: () => void;
  selectedItems: SelectedItems;
  onCreateNewRelationship: ({
    localNamespace,
    foreignNamespace,
  }: {
    localNamespace: string;
    foreignNamespace: string;
  }) => void;
  onRelationshipDrawn: () => void;
}> = ({
  diagramLabel,
  database,
  isNewlyCreatedDiagram,
  model,
  isInRelationshipDrawingMode,
  newCollection,
  onAddNewFieldToCollection,
  onMoveCollection,
  onCollectionSelect,
  onRelationshipSelect,
  onFieldSelect,
  onDiagramBackgroundClicked,
  onCreateNewRelationship,
  onRelationshipDrawn,
  selectedItems,
}) => {
  const isDarkMode = useDarkMode();
  const diagram = useRef(useDiagram());
  const { openDrawer } = useDrawerActions();
  const { isDrawerOpen } = useDrawerState();
  const [showDataInfoBanner, setshowDataInfoBanner] = useState(
    isNewlyCreatedDiagram ?? false
  );

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
    const highlightedFields = getHighlightedFields(
      selectedItems,
      model?.relationships
    );
    return (model?.collections ?? []).map((coll) => {
      const selected =
        !!selectedItems &&
        selectedItems.type === 'collection' &&
        selectedItems.id === coll.ns;
      return collectionToDiagramNode({
        ...coll,
        highlightedFields,
        selectedField:
          selectedItems?.type === 'field' && selectedItems.namespace === coll.ns
            ? selectedItems.fieldPath
            : undefined,
        onClickAddNewFieldToCollection: () =>
          onAddNewFieldToCollection(coll.ns),
        selected,
        isInRelationshipDrawingMode,
      });
    });
  }, [
    onAddNewFieldToCollection,
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
    const wasDrawerPreviouslyOpened = previouslyOpenedDrawer.current;
    previouslyOpenedDrawer.current = !!isDrawerOpen;

    if (!newCollection) return;
    const node = nodes.find((n) => n.id === newCollection);
    if (!node) return;

    // For calculating the center, we're taking into account the drawer,
    // so that the new node is centered in the visible part.
    const drawerOffset = wasDrawerPreviouslyOpened ? 0 : 240;
    const zoom = diagram.current.getViewport().zoom;
    const drawerOffsetInDiagramCoords = drawerOffset / zoom;
    const newNodeWidth = 244;
    const newNodeHeight = 64;
    return rafraf(() => {
      void diagram.current.setCenter(
        node.position.x + newNodeWidth / 2 + drawerOffsetInDiagramCoords,
        node.position.y + newNodeHeight / 2,
        {
          duration: 500,
          zoom,
        }
      );
    });
  }, [newCollection, nodes, isDrawerOpen]);

  const handleNodesConnect = useCallback(
    (source: string, target: string) => {
      onCreateNewRelationship({
        localNamespace: source,
        foreignNamespace: target,
      });
      onRelationshipDrawn();
    },
    [onRelationshipDrawn, onCreateNewRelationship]
  );

  const onNodeClick = useCallback(
    (_evt: React.MouseEvent, node: NodeProps) => {
      if (node.type !== 'collection') {
        return;
      }
      onCollectionSelect(node.id);
      openDrawer(DATA_MODELING_DRAWER_ID);
    },
    [onCollectionSelect, openDrawer]
  );

  const onEdgeClick = useCallback(
    (_evt: React.MouseEvent, edge: EdgeProps) => {
      onRelationshipSelect(edge.id);
      openDrawer(DATA_MODELING_DRAWER_ID);
    },
    [onRelationshipSelect, openDrawer]
  );

  const onFieldClick = useCallback(
    (_evt: React.MouseEvent, { id: fieldPath, nodeId: namespace }) => {
      _evt.stopPropagation(); // TODO(COMPASS-9659): should this be handled by the diagramming package?
      if (!Array.isArray(fieldPath)) return; // TODO(COMPASS-9659): could be avoided with generics in the diagramming package
      onFieldSelect(namespace, fieldPath);
      openDrawer(DATA_MODELING_DRAWER_ID);
    },
    [onFieldSelect, openDrawer]
  );

  const onNodeDragStop = useCallback(
    (evt: React.MouseEvent, node: NodeProps) => {
      onMoveCollection(node.id, [node.position.x, node.position.y]);
    },
    [onMoveCollection]
  );

  const onPaneClick = useCallback(() => {
    onDiagramBackgroundClicked();
  }, [onDiagramBackgroundClicked]);

  const onConnect = useCallback(
    ({ source, target }: { source: string; target: string }) => {
      handleNodesConnect(source, target);
    },
    [handleNodesConnect]
  );

  return (
    <div
      ref={setDiagramContainerRef}
      className={modelPreviewContainerStyles}
      data-testid="diagram-editor-container"
    >
      <div className={modelPreviewStyles} data-testid="model-preview">
        {showDataInfoBanner && (
          <Banner
            variant="info"
            dismissible
            onClose={() => setshowDataInfoBanner(false)}
            className={dataInfoBannerStyles}
          >
            <h4>Worried about your data?</h4>
            This diagram was generated based on a sample of documents from{' '}
            {database ?? 'a database'}. Changes made to the model here persist
            in the diagram for planning purposes only and will not impact your
            data.
          </Banner>
        )}
        <Diagram
          isDarkMode={isDarkMode}
          title={diagramLabel}
          edges={edges}
          nodes={nodes}
          // With threshold too low clicking sometimes gets confused with
          // dragging
          nodeDragThreshold={5}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          onFieldClick={onFieldClick}
          fitViewOptions={ZOOM_OPTIONS}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
        />
      </div>
    </div>
  );
};

const ConnectedDiagramContent = connect(
  (state: DataModelingState) => {
    const { diagram } = state;
    const model = diagram ? selectCurrentModelFromState(state) : null;
    return {
      model,
      diagramLabel: diagram?.name || 'Schema Preview',
      selectedItems: state.diagram?.selectedItems ?? null,
      newCollection: diagram?.draftCollection,
      isNewlyCreatedDiagram: diagram?.isNewlyCreated,
      database: model?.collections[0]?.ns
        ? toNS(model.collections[0].ns).database
        : null, // TODO(COMPASS-9718): use diagram.database
    };
  },
  {
    onAddNewFieldToCollection: addNewFieldToCollection,
    onMoveCollection: moveCollection,
    onCollectionSelect: selectCollection,
    onRelationshipSelect: selectRelationship,
    onFieldSelect: selectField,
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
