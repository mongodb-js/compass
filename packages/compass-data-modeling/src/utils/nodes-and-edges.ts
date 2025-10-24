import toNS from 'mongodb-ns';
import type {
  EdgeProps,
  NodeField,
  NodeGlyph,
  NodeProps,
} from '@mongodb-js/compass-components';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { SelectedItems } from '../store/diagram';
import type {
  DataModelCollection,
  FieldPath,
  Relationship,
} from '../services/data-model-storage';
import { traverseSchema } from './schema-traversal';
import { areFieldPathsEqual, isIdField } from './utils';

const NO_HIGHLIGHTED_FIELDS = {};

export const getHighlightedFields = (
  selectedItems: SelectedItems | null,
  relationships?: Relationship[]
): Record<string, string[][] | undefined> => {
  if (!selectedItems || selectedItems.type !== 'relationship')
    return NO_HIGHLIGHTED_FIELDS;
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

const getBaseNodeField = (fieldPath: string[]): NodeField => {
  return {
    name: fieldPath[fieldPath.length - 1],
    id: fieldPath,
    depth: fieldPath.length - 1,
  };
};

/**
 * Create the base field list to be used for positioning and measuring in node layouts.
 */
export const getBaseFieldsFromSchema = ({
  jsonSchema,
}: {
  jsonSchema: MongoDBJSONSchema;
}): NodeField[] => {
  if (!jsonSchema || !jsonSchema.properties) {
    return [];
  }
  const fields: NodeField[] = [];

  traverseSchema({
    jsonSchema,
    visitor: ({ fieldPath }) => {
      fields.push(getBaseNodeField(fieldPath));
    },
  });

  return fields;
};

const KEY_GLYPH: NodeGlyph[] = ['key'];
const NO_GLYPH: NodeGlyph[] = [];

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
        ...getBaseNodeField(fieldPath),
        type: fieldTypes.length === 1 ? fieldTypes[0] : fieldTypes,
        glyphs:
          fieldTypes.length === 1 && fieldTypes[0] === 'objectId'
            ? KEY_GLYPH
            : NO_GLYPH,
        selectable: true,
        selected:
          !!selectedField?.length &&
          areFieldPathsEqual(fieldPath, selectedField),
        editable: !isIdField(fieldPath),
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
}: Pick<DataModelCollection, 'ns' | 'jsonSchema' | 'displayPosition'>): Pick<
  NodeProps,
  'id' | 'position' | 'fields'
> {
  return {
    id: ns,
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    fields: getBaseFieldsFromSchema({ jsonSchema }),
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
};

export function collectionToDiagramNode({
  ns,
  jsonSchema,
  displayPosition,
  selectedField,
  highlightedFields,
  selected,
  isInRelationshipDrawingMode,
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
  };
}

function findNodeByNS(ns: string, nodes: NodeProps[]): NodeProps | undefined {
  return nodes.find((node) => node.id === ns);
}

function findFieldIndex({
  fieldPath,
  nodes,
  ns,
}: {
  fieldPath: string[];
  nodes: NodeProps[];
  ns?: string;
}): number | undefined {
  if (!ns || !fieldPath.length) return undefined;
  const node = findNodeByNS(ns, nodes);
  if (!node) return undefined;

  for (const [index, field] of node.fields.entries()) {
    if (!field.id || !Array.isArray(field.id)) continue;
    // TODO(COMPASS-9504 and COMPASS-9935): Accept partial paths for collapsed nodes and fields.
    if (areFieldPathsEqual(field.id, fieldPath)) return index;
  }
}

export function relationshipToDiagramEdge(
  relationship: Relationship,
  selected = false,
  nodes: NodeProps[]
): EdgeProps {
  const [source, target] = relationship.relationship;
  return {
    id: relationship.id,
    source: source.ns ?? '',
    target: target.ns ?? '',
    sourceFieldIndex: findFieldIndex({
      fieldPath: source.fields ?? [],
      nodes,
      ns: source.ns ?? undefined,
    }),
    targetFieldIndex: findFieldIndex({
      fieldPath: target.fields ?? [],
      nodes,
      ns: target.ns ?? undefined,
    }),
    markerStart: source.cardinality === 1 ? 'one' : 'many',
    markerEnd: target.cardinality === 1 ? 'one' : 'many',
    selected,
  };
}
