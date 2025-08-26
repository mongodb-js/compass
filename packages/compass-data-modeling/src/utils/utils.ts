import type { FieldPath, Relationship } from '../services/data-model-storage';

export function areFieldPathsEqual(
  fieldA: FieldPath,
  fieldB: FieldPath
): boolean {
  return JSON.stringify(fieldA) === JSON.stringify(fieldB);
}

export function isRelationshipInvolvingField(
  relationship: Relationship['relationship'],
  namespace: string,
  fieldPath: FieldPath
): boolean {
  const [local, foreign] = relationship;
  return (
    (local.ns === namespace &&
      local.fields !== null &&
      areFieldPathsEqual(local.fields, fieldPath)) ||
    (foreign.ns === namespace &&
      foreign.fields !== null &&
      areFieldPathsEqual(foreign.fields, fieldPath))
  );
}
