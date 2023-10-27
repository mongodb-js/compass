import _ from 'lodash';
import React, { useCallback, useState, memo, useEffect } from 'react';
import { connect } from 'react-redux';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Position,
  // useNodesState,
  // useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useStore,
} from 'reactflow';
import { Button, css } from '@mongodb-js/compass-components';
import type { RootState } from '../modules';
import type { DatabaseSchemaStatus } from '../modules/database-schema';
import { loadDatabaseSchema } from '../modules/database-schema';
import type {
  CollectionFieldReference,
  DatabaseSchema,
} from '../utils/analyze-database';

import 'reactflow/dist/style.css';

type DatabaseSchemaContianerProps = {
  databaseName?: string;
  status: DatabaseSchemaStatus;
  schema?: DatabaseSchema;
  onLoadDatabaseSchema: () => void;
};

type CollectionNodeProps = Node & {
  data: {
    label: string;
  };
};

const collectionNodeStyles = css({
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  border: '1px solid #1a192b',
  borderRadius: '3px',
  padding: '8px',
});

const CollectionNode = memo(function CollectionNode({
  id,
  data,
}: CollectionNodeProps) {
  const size = useStore((s) => {
    const node = s.nodeInternals.get(id);

    return {
      width: node?.width,
      height: node?.height,
    };
  });
  return (
    <div
      className={collectionNodeStyles}
      style={{ width: size.width || 0, height: size.height || 0 }}
    >
      <strong>{data.label}</strong>
    </div>
  );
});

const nodeTypes = {
  collectionNode: CollectionNode,
};

function isFieldMatch(
  field: CollectionFieldReference,
  collectionName: string,
  fieldPath: string[]
) {
  return (
    field.collection === collectionName && _.isEqual(field.fieldPath, fieldPath)
  );
}

const collectionNameOffset = 36;
const fieldOffset = 32;
//const collectionOffset = 32;

const noHandlesStyles = css({
  '.react-flow__handle': {
    opacity: 0,
  },
});

function makeNodes(databaseSchema?: DatabaseSchema) {
  const nodes: Node[] = [];

  if (!databaseSchema) {
    return [];
  }

  let x = 100;
  const y = 100;

  for (const [collectionName, collectionSchema] of Object.entries(
    databaseSchema.collections
  )) {
    const height =
      collectionNameOffset + collectionSchema.fields.length * fieldOffset + 8;
    nodes.push({
      id: collectionName,
      type: 'collectionNode',
      position: { x, y },
      data: { label: collectionName },
      style: {
        width: 170,
        height,
      },
    });

    for (const [index, field] of collectionSchema.fields.entries()) {
      const isSource = !!databaseSchema.relationships.find((r) =>
        isFieldMatch(r.to, collectionName, field.path)
      );
      const isTarget = !!databaseSchema.relationships.find((r) =>
        isFieldMatch(r.from, collectionName, field.path)
      );
      const type = isSource ? 'input' : isTarget ? 'output' : 'default';
      nodes.push({
        id: `${collectionName}_${field.path.join('-')}`,
        type,
        sourcePosition: isSource ? Position.Left : undefined,
        targetPosition: isTarget ? Position.Right : undefined,
        data: { label: field.name },
        position: { x: 10, y: collectionNameOffset + index * fieldOffset },
        style: {
          padding: '4px 10px',
          textAlign: 'left',
        },
        className: isSource || isTarget ? undefined : noHandlesStyles,
        parentNode: collectionName,
        extent: 'parent',
        draggable: false,
      });
    }

    x += 200;
    //y = y + height + collectionOffset;
  }

  console.log(nodes);

  return nodes;
}

function makeEdges(databaseSchema?: DatabaseSchema) {
  const edges: Edge[] = [
    //{ id: 'a1-b2', source: 'A-1', target: 'B-2' },
  ];

  if (!databaseSchema?.relationships) {
    return edges;
  }

  for (const relationship of databaseSchema.relationships) {
    // the source/target naming is inverted compared to our from/to
    const target = `${
      relationship.from.collection
    }_${relationship.from.fieldPath.join('-')}`;
    const source = `${
      relationship.to.collection
    }_${relationship.to.fieldPath.join('-')}`;
    edges.push({
      id: `${source}:${target}`,
      source,
      target,
    });
  }

  console.log(edges);

  return edges;
}

function DatabaseSchemaContainer({
  databaseName,
  status,
  schema,
  onLoadDatabaseSchema,
}: DatabaseSchemaContianerProps) {
  const [dbName, setDbName] = useState<string | undefined>(databaseName);
  const [nodes, setNodes] = useState<Node[]>(makeNodes(schema));
  const [edges, setEdges] = useState<Edge[]>(makeEdges(schema));

  useEffect(() => {
    // TODO: this is just some crude caching to stop it re-rendering too much
    setDbName(databaseName);
    setNodes(makeNodes(schema));
    setEdges(makeEdges(schema));
  }, [schema, databaseName, nodes.length]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  if (status === 'disabled') {
    // hack
    return (
      <div style={{ padding: '20px' }}>
        <Button onClick={onLoadDatabaseSchema}>Load</Button>
      </div>
    );
  }

  if (status === 'loading') {
    // hack
    return <div style={{ padding: '20px' }}>loading...</div>;
  }

  return (
    <div style={{ width: '100vw', height: 'calc(100vh - 76px)' }}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default connect(
  (state: RootState) => {
    return {
      status: state.databaseSchema.status,
      schema: state.databaseSchema.schema,
    };
  },
  { onLoadDatabaseSchema: loadDatabaseSchema }
)(DatabaseSchemaContainer);
