import toNS from 'mongodb-ns';
import type {
  EdgeProps,
  NodeField,
  NodeGlyph,
  NodeProps,
} from '@mongodb-js/compass-components';
import type { SelectedItems } from '../store/diagram';
import {
  DEFAULT_IS_EXPANDED,
  type DataModelCollection,
  type FieldData,
  type FieldPath,
  type Relationship,
} from '../services/data-model-storage';
import { traverseSchema } from './schema-traversal';
import {
  areFieldPathsEqual,
  isIdField,
  isRelationshipValid,
  isSameFieldOrAncestor,
  serializeFieldPath,
} from './utils';

const NO_HIGHLIGHTED_FIELDS = {};

export const getHighlightedFields = (
  selectedItems: SelectedItems | null,
  relationships?: Relationship[]
): Record<string, string[][] | undefined> => {
  if (!selectedItems || selectedItems.type !== 'relationship')
    return NO_HIGHLIGHTED_FIELDS;
  const { id } = selectedItems;
  const { relationship } = relationships?.find((rel) => rel.id === id) ?? {};
  const selection: Record<string, string[][] | undefined> = Object.create(null);
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
} & Required<Pick<NodeField, 'id' | 'name' | 'depth' | 'type' | 'expanded'>>;

const getBaseNodeField = (
  fieldPath: string[],
  fieldTypes: string[],
  expanded: boolean
): BaseNodeField => {
  return {
    name: fieldPath[fieldPath.length - 1],
    path: fieldPath,
    id: fieldPath,
    depth: fieldPath.length - 1,
    type: fieldTypes.length === 1 ? fieldTypes[0] : fieldTypes,
    expanded,
  };
};

/**
 * Create the base field list to be used for positioning and measuring in node layouts.
 */
export const getBaseFieldsFromSchema = ({
  fieldData,
}: {
  fieldData: FieldData;
}): BaseNodeField[] => {
  if (!fieldData || !fieldData.properties) {
    return [];
  }
  const fields: BaseNodeField[] = [];

  traverseSchema({
    jsonSchema: fieldData,
    visitor: ({ fieldPath, fieldTypes, fieldSchema }) => {
      fields.push(
        getBaseNodeField(
          fieldPath,
          fieldTypes,
          fieldSchema.expanded ?? DEFAULT_IS_EXPANDED
        )
      );
    },
  });

  return fields;
};

const KEY_GLYPH: NodeGlyph[] = ['key'];
const NO_GLYPH: NodeGlyph[] = [];

type ExtendedNodeField = BaseNodeField &
  Required<
    Pick<
      NodeField,
      'glyphs' | 'selectable' | 'selected' | 'editable' | 'expanded'
    >
  > &
  Pick<NodeField, 'variant'>;

const getExpansionStatus = ({
  fieldPath,
  isExpanded: _isExpanded,
  highlightedFields,
  selectedField,
}: {
  fieldPath: FieldPath;
  isExpanded?: boolean;
  highlightedFields?: FieldPath[];
  selectedField?: FieldPath;
}): boolean => {
  const isExpanded = _isExpanded ?? DEFAULT_IS_EXPANDED;
  if (isExpanded) return true;
  if (
    selectedField &&
    isSameFieldOrAncestor(fieldPath, selectedField.slice(0, -1))
  ) {
    console.log('expanding for selected field', selectedField, fieldPath);
    // this field is an ancestor of the selected field - we expand it to ensure the selected field is visible
    return true;
  }
  if (
    highlightedFields &&
    highlightedFields.some((highlightedField: FieldPath) =>
      isSameFieldOrAncestor(fieldPath, highlightedField.slice(0, -1))
    )
  ) {
    // this field is an ancestor of a highlighted field - we expand it to ensure the highlighted field is visible
    return true;
  }
  return false;
};

export const getExtendedFields = ({
  fieldData,
  highlightedFields: _highlightedFields = [],
  selectedField: _selectedField,
}: {
  fieldData: FieldData;
  highlightedFields?: FieldPath[];
  selectedField?: FieldPath;
}): ExtendedNodeField[] => {
  if (!fieldData || !fieldData.properties) {
    return [];
  }

  const baseFields = getBaseFieldsFromSchema({ fieldData });

  // we do not clean up selected/highlighted fields because they might be valid again after redo/undo operations
  // so we just ignore them if they do not exist in the current field list
  const existingFields = new Set<string>(
    baseFields.map((f) => serializeFieldPath(f.path))
  );
  const selectedField =
    _selectedField && existingFields.has(serializeFieldPath(_selectedField))
      ? _selectedField
      : undefined;
  const highlightedFields = _highlightedFields.filter((hf) =>
    existingFields.has(serializeFieldPath(hf))
  );

  return baseFields.map((field): ExtendedNodeField => {
    return {
      ...field,
      glyphs: field.type === 'objectId' ? KEY_GLYPH : NO_GLYPH,
      selectable: true,
      selected:
        !!selectedField?.length &&
        areFieldPathsEqual(field.path, selectedField),
      editable: !isIdField(field.path),
      variant:
        highlightedFields.length &&
        highlightedFields.some((highlightedField) =>
          areFieldPathsEqual(field.path, highlightedField)
        )
          ? 'preview'
          : undefined,
      expanded: getExpansionStatus({
        fieldPath: field.path,
        isExpanded: field.expanded,
        highlightedFields,
        selectedField,
      }),
    };
  });
};

/**
 * Create a base node to be used for positioning and measuring in node layouts.
 */
export function collectionToBaseNodeForLayout({
  ns,
  fieldData,
  displayPosition,
}: Pick<DataModelCollection, 'ns' | 'fieldData' | 'displayPosition'>): Pick<
  NodeProps,
  'id' | 'position' | 'fields'
> {
  return {
    id: ns,
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    fields: getBaseFieldsFromSchema({ fieldData }),
  };
}

type CollectionWithRenderOptions = Pick<
  DataModelCollection,
  'ns' | 'fieldData' | 'displayPosition'
> & {
  highlightedFields: Record<string, FieldPath[] | undefined>;
  selectedField?: FieldPath;
  selected: boolean;
  isInRelationshipDrawingMode: boolean;
  relationships: Relationship[];
};

export function collectionToDiagramNode({
  ns,
  fieldData,
  displayPosition,
  selectedField,
  highlightedFields,
  selected,
  isInRelationshipDrawingMode,
  relationships,
}: CollectionWithRenderOptions): NodeProps {
  let variant: NodeProps['variant'] = undefined;
  if (relationships.some((r) => !isRelationshipValid(r))) {
    variant = {
      type: 'warn' as const,
      warnMessage: 'One or more relationships cannot be resolved.',
    };
  }
  return {
    id: ns,
    type: 'collection',
    position: {
      x: displayPosition[0],
      y: displayPosition[1],
    },
    title: toNS(ns).collection,
    fields: getExtendedFields({
      fieldData,
      highlightedFields: highlightedFields[ns] ?? undefined,
      selectedField,
    }),
    selected,
    connectable: isInRelationshipDrawingMode,
    draggable: !isInRelationshipDrawingMode,
    variant,
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
    sourceFieldId: source.fields ?? [],
    targetFieldId: target.fields ?? [],
    markerStart: source.cardinality === 1 ? 'one' : 'many',
    markerEnd: target.cardinality === 1 ? 'one' : 'many',
    selected,
    animated: !isRelationshipValid(relationship),
  };
}
