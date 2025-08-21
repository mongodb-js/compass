import React from 'react';
import toNS from 'mongodb-ns';
import { InlineDefinition, Body, css } from '@mongodb-js/compass-components';
import type { NodeProps, EdgeProps } from '@mongodb-js/diagramming';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { SelectedItems } from '../store/diagram';
import type {
  DataModelCollection,
  FieldPath,
  Relationship,
} from '../services/data-model-storage';
import { traverseSchema } from './schema-traversal';

function getBsonTypeName(bsonType: string) {
  switch (bsonType) {
    case 'array':
      return '[]';
    default:
      return bsonType;
  }
}

const mixedTypeTooltipContentStyles = css({
  overflowWrap: 'anywhere',
  textWrap: 'wrap',
  textAlign: 'left',
});

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

export const getHighlightedFields = (
  selectedItems: SelectedItems | null,
  relationships?: Relationship[]
): Record<string, string[][] | undefined> => {
  if (!selectedItems || selectedItems.type !== 'relationship') return {};
  const { id } = selectedItems;
  const { relationship } = relationships?.find((rel) => rel.id === id) ?? {};
  const selection: Record<string, string[][] | undefined> = {};
  if (relationship?.[0].ns && relationship?.[0].fields) {
    selection[relationship[0].ns] = [relationship[0].fields];
  }
  if (relationship?.[1].ns && relationship?.[1].fields) {
    if (!selection[relationship[1].ns]) {
      selection[relationship[1].ns] = [];
    }
    selection[relationship[1].ns]!.push(relationship[1].fields);
  }
  return selection;
};

export const getFieldsFromSchema = ({
  jsonSchema,
  highlightedFields = [],
  selectedField,
}: {
  jsonSchema: MongoDBJSONSchema;
  highlightedFields?: FieldPath[];
  selectedField?: FieldPath;
}): NodeProps['fields'] => {
  if (!jsonSchema || !jsonSchema.properties) {
    return [];
  }
  const fields: NodeProps['fields'] = [];

  traverseSchema({
    jsonSchema,
    visitor: ({ fieldPath, fieldTypes }) => {
      fields.push({
        name: fieldPath[fieldPath.length - 1],
        id: fieldPath,
        type: getFieldTypeDisplay(fieldTypes),
        depth: fieldPath.length - 1,
        glyphs:
          fieldTypes.length === 1 && fieldTypes[0] === 'objectId'
            ? ['key']
            : [],
        selectable: true,
        selected: JSON.stringify(fieldPath) === JSON.stringify(selectedField),
        variant:
          highlightedFields.length &&
          highlightedFields.some(
            (highlightedField) =>
              JSON.stringify(fieldPath) === JSON.stringify(highlightedField)
          )
            ? 'preview'
            : undefined,
      });
    },
  });

  return fields;
};

export function collectionToDiagramNode(
  coll: Pick<DataModelCollection, 'ns' | 'jsonSchema' | 'displayPosition'>,
  options: {
    highlightedFields?: Record<string, FieldPath[] | undefined>;
    selectedField?: FieldPath;
    selected?: boolean;
    isInRelationshipDrawingMode?: boolean;
  } = {}
): NodeProps {
  const {
    highlightedFields = {},
    selectedField,
    selected = false,
    isInRelationshipDrawingMode = false,
  } = options;

  return {
    id: coll.ns,
    type: 'collection',
    position: {
      x: coll.displayPosition[0],
      y: coll.displayPosition[1],
    },
    title: toNS(coll.ns).collection,
    fields: getFieldsFromSchema({
      jsonSchema: coll.jsonSchema,
      highlightedFields: highlightedFields[coll.ns] ?? undefined,
      selectedField,
    }),
    selected,
    connectable: isInRelationshipDrawingMode,
    draggable: !isInRelationshipDrawingMode,
  };
}

export function relationshipToDiagramEdge(
  relationship: Relationship,
  selected = false
): EdgeProps {
  const [source, target] = relationship.relationship;
  return {
    id: relationship.id,
    source: source.ns ?? '',
    target: target.ns ?? '',
    markerStart: source.cardinality === 1 ? 'one' : 'many',
    markerEnd: target.cardinality === 1 ? 'one' : 'many',
    selected,
  };
}
