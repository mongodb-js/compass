import React from 'react';
import toNS from 'mongodb-ns';
import { InlineDefinition, Body, css } from '@mongodb-js/compass-components';
import type { NodeProps, EdgeProps } from '@mongodb-js/diagramming';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { SelectedItems } from '../store/diagram';
import type {
  DataModelCollection,
  Relationship,
} from '../services/data-model-storage';

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

export const getSelectedFields = (
  selectedItems: SelectedItems | null,
  relationships?: Relationship[]
): Record<string, string[] | null | undefined> => {
  if (!selectedItems || selectedItems.type !== 'relationship') return {};
  const { id } = selectedItems;
  const { relationship } = relationships?.find((rel) => rel.id === id) ?? {};
  const selection: Record<string, string[] | null | undefined> = {};
  if (relationship?.[0].ns) {
    selection[relationship[0].ns] = relationship[0].fields;
  }
  if (relationship?.[1].ns) {
    selection[relationship[1].ns] = relationship[1].fields;
  }
  return selection;
};

export const getFieldsFromSchema = (
  jsonSchema: MongoDBJSONSchema,
  highlightedFields: string[] = [],
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
    const children: (MongoDBJSONSchema | MongoDBJSONSchema[])[] = [];
    if (field.bsonType) {
      types.push(field.bsonType);
    }
    if (field.properties) {
      children.push(field);
    }
    if (field.items) {
      children.push((field.items as MongoDBJSONSchema).anyOf || field.items);
    }
    if (field.anyOf) {
      for (const variant of field.anyOf) {
        if (variant.bsonType) {
          types.push(variant.bsonType);
        }
        if (variant.properties) {
          children.push(variant);
        }
        if (variant.items) {
          children.push(variant.items);
        }
      }
    }

    fields.push({
      name,
      type: getFieldTypeDisplay(types.flat()),
      depth: depth,
      glyphs: types.length === 1 && types[0] === 'objectId' ? ['key'] : [],
      variant:
        highlightedFields.length &&
        highlightedFields[highlightedFields.length - 1] === name
          ? 'preview'
          : undefined,
    });

    if (children.length > 0) {
      fields = [
        ...fields,
        ...children
          .flat()
          .flatMap((child) =>
            getFieldsFromSchema(
              child,
              name === highlightedFields[0] ? highlightedFields.slice(1) : [],
              depth + 1
            )
          ),
      ];
    }
  }

  return fields;
};

export function collectionToDiagramNode(
  coll: Pick<DataModelCollection, 'ns' | 'jsonSchema' | 'displayPosition'>,
  selectedFields: Record<string, string[] | null | undefined> = {},
  selected = false
): NodeProps {
  return {
    id: coll.ns,
    type: 'collection',
    position: {
      x: coll.displayPosition[0],
      y: coll.displayPosition[1],
    },
    title: toNS(coll.ns).collection,
    fields: getFieldsFromSchema(
      coll.jsonSchema,
      selectedFields[coll.ns] ?? undefined,
      0
    ),
    selected,
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
