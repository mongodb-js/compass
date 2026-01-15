import type { MongoDBJSONSchema } from 'mongodb-schema';
import type {
  FieldData,
  FieldPath,
  Relationship,
} from '../services/data-model-storage';
import { cloneDeepWith } from 'lodash';

export const isIdField = (fieldPath: FieldPath): boolean =>
  fieldPath.length === 1 && fieldPath[0] === '_id';

export const serializeFieldPath = (fieldPath: FieldPath): string =>
  JSON.stringify(fieldPath);

export function areFieldPathsEqual(
  fieldA: FieldPath,
  fieldB: FieldPath
): boolean {
  return serializeFieldPath(fieldA) === serializeFieldPath(fieldB);
}

export function isSameFieldOrAncestor(
  ancestor: FieldPath,
  child: FieldPath
): boolean {
  return ancestor.every((pathPart, index) => pathPart === child[index]);
}

export function isRelationshipOfAField(
  relationship: Relationship['relationship'],
  namespace: string,
  fieldPath: FieldPath
): boolean {
  const [local, foreign] = relationship;
  return (
    (local.ns === namespace &&
      !!local.fields &&
      areFieldPathsEqual(local.fields, fieldPath)) ||
    (foreign.ns === namespace &&
      !!foreign.fields &&
      areFieldPathsEqual(foreign.fields, fieldPath))
  );
}

export function isRelationshipInvolvingField(
  relationship: Relationship['relationship'],
  namespace: string,
  fieldPath: FieldPath
): boolean {
  const [local, foreign] = relationship;
  return (
    (local.ns === namespace &&
      !!local.fields &&
      isSameFieldOrAncestor(fieldPath, local.fields)) ||
    (foreign.ns === namespace &&
      !!foreign.fields &&
      isSameFieldOrAncestor(fieldPath, foreign.fields))
  );
}

// Sometimes, we may receive the same event through different sources.
// For example, Undo/Redo may be caught both by a HTML hotkey listener
// and the Electron menu accelerator. This debounce function helps
// to avoid invoking the handler multiple times in such cases.
// 'count' specifies how many different source handlers are generated
// in the returned array.
export function dualSourceHandlerDebounce(
  handler: () => void,
  count = 2,
  now = Date.now
): (() => void)[] {
  let lastInvocationSource: number = -1;
  let lastInvocationTime: number = -1;
  const makeHandler = (index: number): (() => void) => {
    return () => {
      const priorInvocationTime = lastInvocationTime;
      lastInvocationTime = now();

      // Call the current handler if:
      // - It was the last one to be invoked (i.e. it "owns" this callback), or
      // - No handler was ever invoked yet, or
      // - Enough time has passed that it's unlikely that we just received
      //   the same event as in the last call.
      if (
        lastInvocationSource === index ||
        lastInvocationSource === -1 ||
        lastInvocationTime - priorInvocationTime > 100
      ) {
        lastInvocationSource = index;
        handler();
      }
    };
  };
  return Array.from({ length: count }, (_, i) => makeHandler(i));
}

export function getNamespaceRelationships(
  namespace: string,
  relationships: Relationship[] = []
): Relationship[] {
  return relationships.filter((r) => {
    const [local, foreign] = r.relationship;
    return local.ns === namespace || foreign.ns === namespace;
  });
}

export function isRelationshipValid(relationship: Relationship): boolean {
  const [source, target] = relationship.relationship;
  if (
    !source.ns ||
    !target.ns ||
    !source.fields ||
    !target.fields ||
    source.fields.length === 0 ||
    target.fields.length === 0
  ) {
    return false;
  }

  return true;
}

export function mapFieldDataToJsonSchema(
  fieldData: FieldData
): MongoDBJSONSchema {
  // we need to deep omit 'expanded' property
  console.log('Mapping field data to JSON schema, input:', fieldData);
  const newFieldData = cloneDeepWith(fieldData, (value) => {
    if (!value) return value;
    if (typeof value === 'object' && 'expanded' in value) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expanded: _expanded, ...rest } = value;
      return rest;
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === 'object' && 'expanded' in item) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { expanded: _expanded, ...rest } = item;
          return rest;
        }
        return item;
      });
    }
    return value;
  });
  return newFieldData;
}
