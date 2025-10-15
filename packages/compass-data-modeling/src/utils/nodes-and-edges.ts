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
import { areFieldPathsEqual } from './utils';

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

type BaseNodeField = {
  path: string[];
} & Required<Pick<NodeField, 'id' | 'name' | 'depth' | 'type'>>;

const getBaseNodeField = (
  fieldPath: string[],
  fieldTypes: string[]
): BaseNodeField => {
  return {
    id: fieldPath,
    name: fieldPath[fieldPath.length - 1],
    path: fieldPath,
    depth: fieldPath.length - 1,
    type: fieldTypes.length === 1 ? fieldTypes[0] : fieldTypes,
  };
};

/**
 * Create the base field list to be used for positioning and measuring in node layouts.
 */
export const getBaseFieldsFromSchema = ({
  jsonSchema,
  isExpanded = true,
}: {
  jsonSchema: MongoDBJSONSchema;
  isExpanded?: boolean;
}): BaseNodeField[] => {
  if (!jsonSchema || !jsonSchema.properties) {
    return [];
  }
  const fields: BaseNodeField[] = [];

  traverseSchema({
    jsonSchema,
    visitor: ({ fieldPath, fieldTypes }) => {
      if (isExpanded || fieldPath.length === 1) {
        fields.push(getBaseNodeField(fieldPath, fieldTypes));
      }
    },
  });

  return fields;
};

const KEY_GLYPH: NodeGlyph[] = ['key'];
const NO_GLYPH: NodeGlyph[] = [];

type ExtendedNodeField = BaseNodeField &
  Required<Pick<NodeField, 'glyphs' | 'selectable' | 'selected'>> &
  Pick<NodeField, 'variant'>;

export const getExtendedFieldsFromSchema = ({
  jsonSchema,
  highlightedFields = [],
  selectedField,
  isExpanded = true,
}: {
  jsonSchema: MongoDBJSONSchema;
  highlightedFields?: FieldPath[];
  selectedField?: FieldPath;
  isExpanded?: boolean;
}): ExtendedNodeField[] => {
  if (!jsonSchema || !jsonSchema.properties) {
    return [];
  }
  return getBaseFieldsFromSchema({
    jsonSchema,
    isExpanded,
  }).map((field): ExtendedNodeField => {
    return {
      ...field,
      glyphs: field.type === 'objectId' ? KEY_GLYPH : NO_GLYPH,
      selectable: true,
      selected:
        !!selectedField?.length &&
        areFieldPathsEqual(field.path, selectedField),
      variant:
        highlightedFields.length &&
        highlightedFields.some((highlightedField) => {
          return areFieldPathsEqual(field.path, highlightedField);
        })
          ? 'preview'
          : undefined,
    };
  });
};

type BaseNode = Required<Pick<NodeProps, 'id' | 'position'>> & {
  fields: BaseNodeField[];
};

/**
 * Create a base node to be used for positioning and measuring in node layouts.
 */
export function collectionToBaseNodeForLayout({
  ns,
  jsonSchema,
  displayPosition,
  isExpanded,
}: Pick<
  DataModelCollection,
  'ns' | 'jsonSchema' | 'displayPosition' | 'isExpanded'
>): BaseNode {
  return {
    id: ns,
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    fields: getBaseFieldsFromSchema({ jsonSchema, isExpanded }),
  };
}

type CollectionWithRenderOptions = Pick<
  DataModelCollection,
  'ns' | 'jsonSchema' | 'displayPosition' | 'isExpanded'
> & {
  highlightedFields: Record<string, FieldPath[] | undefined>;
  selectedField?: FieldPath;
  selected: boolean;
  isInRelationshipDrawingMode: boolean;
};

type ExtendedNode = Required<
  Pick<
    NodeProps,
    | 'id'
    | 'type'
    | 'position'
    | 'title'
    | 'selected'
    | 'connectable'
    | 'draggable'
  >
> & { fields: ExtendedNodeField[] };

export function collectionToDiagramNode({
  ns,
  jsonSchema,
  displayPosition,
  selectedField,
  highlightedFields,
  selected,
  isInRelationshipDrawingMode,
  isExpanded,
}: CollectionWithRenderOptions): ExtendedNode {
  return {
    id: ns,
    type: 'collection',
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    title: toNS(ns).collection,
    fields: getExtendedFieldsFromSchema({
      jsonSchema: jsonSchema,
      highlightedFields: highlightedFields[ns] ?? undefined,
      selectedField,
      isExpanded,
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
