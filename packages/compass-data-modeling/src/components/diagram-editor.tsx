import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import { connect } from 'react-redux';
import toNS from 'mongodb-ns';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { DataModelingState } from '../store/reducer';
import {
  applyInitialLayout,
  moveCollection,
  getCurrentDiagramFromState,
  selectCurrentModel,
} from '../store/diagram';
import {
  Banner,
  Body,
  CancelLoader,
  WorkspaceContainer,
  css,
  spacing,
  Button,
  useDarkMode,
  InlineDefinition,
} from '@mongodb-js/compass-components';
import { cancelAnalysis, retryAnalysis } from '../store/analysis-process';
import {
  Diagram,
  type NodeProps,
  type EdgeProps,
  useDiagram,
  applyLayout,
} from '@mongodb-js/diagramming';
import type { StaticModel } from '../services/data-model-storage';
import DiagramEditorToolbar from './diagram-editor-toolbar';
import ExportDiagramModal from './export-diagram-modal';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { openSidePanel } from '../store/side-panel';

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

const mixedTypeTooltipContentStyles = css({
  overflowWrap: 'anywhere',
  textWrap: 'wrap',
  textAlign: 'left',
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

function getBsonTypeName(bsonType: string) {
  switch (bsonType) {
    case 'array':
      return '[]';
    default:
      return bsonType;
  }
}

function getFieldTypeDisplay(bsonTypes: string[]) {
  if (bsonTypes.length === 0) {
    return 'unknown';
  }

  if (bsonTypes.length === 1) {
    return getBsonTypeName(bsonTypes[0]);
  }

  const typesString = bsonTypes
    .map((bsonType) => getBsonTypeName(bsonType))
    .join(', ');

  // We show `mixed` with a tooltip when multiple bsonTypes were found.
  return (
    <InlineDefinition
      definition={
        <Body className={mixedTypeTooltipContentStyles}>
          Multiple types found in sample: {typesString}
        </Body>
      }
    >
      <div>(mixed)</div>
    </InlineDefinition>
  );
}

export const getFieldsFromSchema = (
  jsonSchema: MongoDBJSONSchema,
  depth = 0
): NodeProps['fields'] => {
  if (!jsonSchema || !jsonSchema.properties) {
    return [];
  }
  let fields: NodeProps['fields'] = [];
  for (const [name, field] of Object.entries(jsonSchema.properties)) {
    // field has types, properties and (optional) children
    // types are either direct, or from anyof
    // children are either direct (properties), from anyOf, items or items.anyOf
    const types: (string | string[])[] = [];
    const children = [];
    if (field.bsonType) types.push(field.bsonType);
    if (field.properties) children.push(field);
    if (field.items)
      children.push((field.items as MongoDBJSONSchema).anyOf || field.items);
    if (field.anyOf) {
      for (const variant of field.anyOf) {
        if (variant.bsonType) types.push(variant.bsonType);
        if (variant.properties) {
          children.push(variant);
        }
        if (variant.items) children.push(variant.items);
      }
    }

    fields.push({
      name,
      type: getFieldTypeDisplay(types.flat()),
      depth: depth,
      glyphs: types.length === 1 && types[0] === 'objectId' ? ['key'] : [],
    });

    if (children.length > 0) {
      fields = [
        ...fields,
        ...children
          .flat()
          .flatMap((child) => getFieldsFromSchema(child, depth + 1)),
      ];
    }
  }

  return fields;
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

const DiagramEditor: React.FunctionComponent<{
  diagramLabel: string;
  step: DataModelingState['step'];
  model: StaticModel | null;
  editErrors?: string[];
  onRetryClick: () => void;
  onCancelClick: () => void;
  onApplyInitialLayout: (positions: Record<string, [number, number]>) => void;
  onMoveCollection: (ns: string, newPosition: [number, number]) => void;
  onOpenSidePanel: () => void;
}> = ({
  diagramLabel,
  step,
  model,
  onRetryClick,
  onCancelClick,
  onApplyInitialLayout,
  onMoveCollection,
  onOpenSidePanel,
}) => {
  const { log, mongoLogId } = useLogger('COMPASS-DATA-MODELING-DIAGRAM-EDITOR');
  const isDarkMode = useDarkMode();
  const diagramContainerRef = useRef<HTMLDivElement | null>(null);
  const diagram = useDiagram();
  const [areNodesReady, setAreNodesReady] = useState(false);

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

  const nodes = useMemo<NodeProps[]>(() => {
    return (model?.collections ?? []).map(
      (coll): NodeProps => ({
        id: coll.ns,
        type: 'collection',
        position: {
          x: coll.displayPosition[0],
          y: coll.displayPosition[1],
        },
        title: toNS(coll.ns).collection,
        fields: getFieldsFromSchema(coll.jsonSchema),
      })
    );
  }, [model?.collections]);

  const applyInitialLayout = useCallback(async () => {
    try {
      const { nodes: positionedNodes } = await applyLayout(
        nodes,
        edges,
        'LEFT_RIGHT'
      );
      onApplyInitialLayout(
        Object.fromEntries(
          positionedNodes.map((node) => [
            node.id,
            [node.position.x, node.position.y],
          ])
        )
      );
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_361),
        'DiagramEditor',
        'Error applying layout:',
        err
      );
    }
  }, [edges, log, nodes, mongoLogId, onApplyInitialLayout]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const isInitialState = nodes.some(
      (node) => isNaN(node.position.x) || isNaN(node.position.y)
    );
    if (isInitialState) {
      void applyInitialLayout();
      return;
    }
    if (!areNodesReady) {
      setAreNodesReady(true);
      setTimeout(() => {
        void diagram.fitView();
      });
    }
  }, [areNodesReady, nodes, diagram, applyInitialLayout]);

  let content;

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
            nodes={areNodesReady ? nodes : []}
            onEdgeClick={() => {
              // TODO: we have to open a side panel with edge details
              onOpenSidePanel();
            }}
            fitViewOptions={{
              maxZoom: 1,
              minZoom: 0.25,
            }}
            onNodeDragStop={(evt, node) => {
              onMoveCollection(node.id, [node.position.x, node.position.y]);
            }}
          />
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
    onApplyInitialLayout: applyInitialLayout,
    onMoveCollection: moveCollection,
    onOpenSidePanel: openSidePanel,
  }
)(DiagramEditor);
