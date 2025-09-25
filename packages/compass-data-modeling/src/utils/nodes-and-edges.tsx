import React from 'react';
import toNS from 'mongodb-ns';
import {
  Body,
  IconButton,
  InlineDefinition,
  css,
  cx,
} from '@mongodb-js/compass-components';
import type { NodeProps, EdgeProps, BaseNode } from '@mongodb-js/diagramming';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { SelectedItems } from '../store/diagram';
import type {
  DataModelCollection,
  FieldPath,
  Relationship,
} from '../services/data-model-storage';
import { traverseSchema } from './schema-traversal';
import { areFieldPathsEqual } from './utils';
import PlusWithSquare from '../components/icons/plus-with-square';

function getBsonTypeName(bsonType: string) {
  switch (bsonType) {
    case 'array':
      return '[]';
    default:
      return bsonType;
  }
}

const addNewFieldStyles = css({
  marginLeft: 'auto',
});

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
        selected: areFieldPathsEqual(fieldPath, selectedField ?? []),
        variant:
          highlightedFields.length &&
          highlightedFields.some((highlightedField) =>
            areFieldPathsEqual(fieldPath, highlightedField)
          )
            ? 'preview'
            : undefined,
      });
    },
  });

  return fields;
};

/**
 * Create a base node to be used for positioning and measuring in node layouts.
 */
export function collectionToBaseNodeForLayout({
  ns,
  jsonSchema,
  displayPosition,
}: Pick<
  DataModelCollection,
  'ns' | 'jsonSchema' | 'displayPosition'
>): BaseNode & Pick<NodeProps, 'fields'> {
  return {
    id: ns,
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    fields: getFieldsFromSchema({ jsonSchema }),
  };
}

type CollectionWithRenderOptions = Pick<
  DataModelCollection,
  'ns' | 'jsonSchema' | 'displayPosition'
> & {
  highlightedFields: Record<string, FieldPath[] | undefined>;
  selectedField?: FieldPath;
  selected: boolean;
  isInRelationshipDrawingMode: boolean;
  onClickAddNewFieldToCollection: () => void;
};

export function collectionToDiagramNode({
  ns,
  jsonSchema,
  displayPosition,
  selectedField,
  highlightedFields,
  selected,
  isInRelationshipDrawingMode,
  onClickAddNewFieldToCollection,
}: CollectionWithRenderOptions): NodeProps {
  return {
    id: ns,
    type: 'collection',
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    title: toNS(ns).collection,
    fields: getFieldsFromSchema({
      jsonSchema: jsonSchema,
      highlightedFields: highlightedFields[ns] ?? undefined,
      selectedField,
    }),
    selected,
    connectable: isInRelationshipDrawingMode,
    draggable: !isInRelationshipDrawingMode,
    actions: onClickAddNewFieldToCollection ? (
      <IconButton
        aria-label="Add Field"
        className={cx(addNewFieldStyles, 'node-add-field-button')}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          onClickAddNewFieldToCollection();
        }}
        title="Add Field"
      >
        <PlusWithSquare />
      </IconButton>
    ) : undefined,
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
