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
  onAddNestedField,
  selectCollection,
  selectRelationship,
  selectBackground,
  type DiagramState,
  selectCurrentModelFromState,
  createNewRelationship,
  addCollection,
  selectField,
  deleteCollection,
  deleteRelationship,
  removeField,
  renameField,
  changeFieldType,
} from '../store/diagram';
import type {
  EdgeProps,
  NodeProps,
  DiagramProps,
} from '@mongodb-js/compass-components';
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
  useThrottledProps,
  rafraf,
  Diagram,
  useDiagram,
  useHotkeys,
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
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
import { FIELD_TYPES } from '../utils/field-types';

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

/**
 * This is a hotfix for COMPASS-9738 where collection names spanning over
 * multiple lines are not accounted for properly in the diagramming package.
 * TODO(COMPASS-9738): Remove this hotfix once we have a proper solution in place.
 */
const diagramStyles = css({
  '[data-nodeid] + div > div > div:first-child > div:nth-child(2)': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
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
  newCollection?: string;
  onAddFieldToObjectField: (ns: string, parentPath: string[]) => void;
  onAddNewFieldToCollection: (ns: string) => void;
  onMoveCollection: (ns: string, newPosition: [number, number]) => void;
  onCollectionSelect: (namespace: string) => void;
  onRelationshipSelect: (rId: string) => void;
  onFieldSelect: (namespace: string, fieldPath: FieldPath) => void;
  onRenameField: (
    namespace: string,
    fieldPath: FieldPath,
    newName: string
  ) => void;
  onChangeFieldType: (data: {
    ns: string;
    fieldPath: FieldPath;
    newTypes: string[];
  }) => void;
  onDiagramBackgroundClicked: () => void;
  onDeleteCollection: (ns: string) => void;
  onDeleteRelationship: (rId: string) => void;
  onDeleteField: (ns: string, fieldPath: FieldPath) => void;
  selectedItems: SelectedItems;
  onCreateNewRelationship: ({
    localNamespace,
    foreignNamespace,
  }: {
    localNamespace: string;
    foreignNamespace: string;
  }) => void;
  onRelationshipDrawn: () => void;
  DiagramComponent?: typeof Diagram;
}> = ({
  diagramLabel,
  database,
  isNewlyCreatedDiagram,
  model,
  isInRelationshipDrawingMode,
  newCollection,
  onAddFieldToObjectField,
  onAddNewFieldToCollection,
  onMoveCollection,
  onCollectionSelect,
  onRelationshipSelect,
  onFieldSelect,
  onRenameField,
  onChangeFieldType,
  onDiagramBackgroundClicked,
  onCreateNewRelationship,
  onRelationshipDrawn,
  onDeleteCollection,
  onDeleteRelationship,
  onDeleteField,
  selectedItems,
  DiagramComponent = Diagram,
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

  const edges = useMemo<EdgeProps[]>(() => {
    return (model?.relationships ?? []).map((relationship) => {
      const selected =
        !!selectedItems &&
        selectedItems.type === 'relationship' &&
        selectedItems.id === relationship.id;
      return relationshipToDiagramEdge(relationship, selected, nodes);
    });
  }, [model?.relationships, selectedItems, nodes]);

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
    (_evt: React.MouseEvent | null, node: NodeProps) => {
      if (node.type !== 'collection') {
        return;
      }
      onCollectionSelect(node.id);
      openDrawer(DATA_MODELING_DRAWER_ID);
    },
    [onCollectionSelect, openDrawer]
  );

  const onEdgeClick = useCallback(
    (_evt: React.MouseEvent | null, edge: EdgeProps) => {
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

  const onClickAddFieldToCollection = useCallback(
    (event: React.MouseEvent<Element>, ns: string) => {
      event.stopPropagation();
      onAddNewFieldToCollection(ns);
    },
    [onAddNewFieldToCollection]
  );

  const onClickAddFieldToObjectField = useCallback(
    (event: React.MouseEvent, nodeId: string, parentPath: string[]) => {
      onAddFieldToObjectField(nodeId, parentPath);
    },
    [onAddFieldToObjectField]
  );

  const onFieldTypeChange = useCallback(
    (ns: string, fieldPath: FieldPath, newTypes: string[]) => {
      onChangeFieldType({
        ns,
        fieldPath,
        newTypes,
      });
    },
    [onChangeFieldType]
  );

  const deleteItem = useCallback(() => {
    switch (selectedItems?.type) {
      case 'collection':
        onDeleteCollection(selectedItems.id);
        break;
      case 'relationship':
        onDeleteRelationship(selectedItems.id);
        break;
      case 'field':
        onDeleteField(selectedItems.namespace, selectedItems.fieldPath);
        break;
      default:
        break;
    }
  }, [selectedItems, onDeleteCollection, onDeleteRelationship, onDeleteField]);
  useHotkeys('Backspace', deleteItem, [deleteItem]);
  useHotkeys('Delete', deleteItem, [deleteItem]);
  useHotkeys(
    'Escape',
    () => {
      onDiagramBackgroundClicked();
    },
    [onDiagramBackgroundClicked]
  );

  const diagramProps: DiagramProps = useMemo(
    () =>
      ({
        isDarkMode,
        title: diagramLabel,
        edges,
        nodes,
        onAddFieldToNodeClick: onClickAddFieldToCollection,
        onAddFieldToObjectFieldClick: onClickAddFieldToObjectField,
        onNodeClick,
        onPaneClick,
        onEdgeClick,
        onFieldClick,
        onFieldNameChange: onRenameField,
        onFieldTypeChange,
        onNodeDragStop,
        onConnect,
        fieldTypes: FIELD_TYPES,
      } satisfies DiagramProps),
    [
      isDarkMode,
      diagramLabel,
      edges,
      nodes,
      onClickAddFieldToCollection,
      onClickAddFieldToObjectField,
      onNodeClick,
      onPaneClick,
      onEdgeClick,
      onFieldClick,
      onRenameField,
      onFieldTypeChange,
      onNodeDragStop,
      onConnect,
    ]
  );

  const throttledDiagramProps = useThrottledProps(diagramProps);

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
            data-testid="data-info-banner"
          >
            <h4>Questions about your data?</h4>
            This diagram was generated based on a sample of documents from{' '}
            {database ?? 'a database'}. Changes made to the diagram will not
            impact your data
          </Banner>
        )}
        <DiagramComponent
          {...throttledDiagramProps}
          // With threshold too low clicking sometimes gets confused with
          // dragging.
          nodeDragThreshold={5}
          fitViewOptions={ZOOM_OPTIONS}
          className={diagramStyles}
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
    onAddFieldToObjectField: onAddNestedField,
    onMoveCollection: moveCollection,
    onCollectionSelect: selectCollection,
    onRelationshipSelect: selectRelationship,
    onFieldSelect: selectField,
    onRenameField: renameField,
    onChangeFieldType: changeFieldType,
    onDiagramBackgroundClicked: selectBackground,
    onCreateNewRelationship: createNewRelationship,
    onDeleteCollection: deleteCollection,
    onDeleteRelationship: deleteRelationship,
    onDeleteField: removeField,
  }
)(DiagramContent);

const DiagramEditor: React.FunctionComponent<{
  step: DataModelingState['step'];
  diagramId?: string;
  onRetryClick: () => void;
  onCancelClick: () => void;
  onAddCollectionClick: () => void;
  DiagramComponent?: typeof Diagram;
}> = ({
  step,
  diagramId,
  onRetryClick,
  onCancelClick,
  onAddCollectionClick,
  DiagramComponent = Diagram,
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
        DiagramComponent={DiagramComponent}
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
      diagramId: diagram?.id,
    };
  },
  {
    onRetryClick: retryAnalysis,
    onCancelClick: cancelAnalysis,
    onAddCollectionClick: addCollection,
  }
)(DiagramEditor);
