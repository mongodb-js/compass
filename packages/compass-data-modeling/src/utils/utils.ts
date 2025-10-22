import type { FieldPath, Relationship } from '../services/data-model-storage';

export const isIdField = (fieldPath: FieldPath): boolean =>
  fieldPath.length === 1 && fieldPath[0] === '_id';

export function areFieldPathsEqual(
  fieldA: FieldPath,
  fieldB: FieldPath
): boolean {
  return JSON.stringify(fieldA) === JSON.stringify(fieldB);
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
