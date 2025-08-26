import type { FieldPath, Relationship } from '../services/data-model-storage';

export function areFieldPathsEqual(
  fieldA: FieldPath,
  fieldB: FieldPath
): boolean {
  return JSON.stringify(fieldA) === JSON.stringify(fieldB);
}

export function isSameFieldOrChild(
  fieldA: FieldPath,
  fieldB: FieldPath
): boolean {
  if (fieldA.length === fieldB.length)
    return areFieldPathsEqual(fieldA, fieldB);
  if (fieldA.length < fieldB.length) return false;
  // fieldA is shorter than fieldB, check if fieldA is a parent of fieldB
  const pathA = JSON.stringify(fieldA);
  const pathB = JSON.stringify(fieldB);
  // ignore the closing bracket - last character in pathB
  return pathA.slice(0, pathB.length - 1) === pathB.slice(0, pathB.length - 1);
}

export function isRelationshipOfAField(
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

export function isRelationshipInvolvingField(
  relationship: Relationship['relationship'],
  namespace: string,
  fieldPath: FieldPath
): boolean {
  const [local, foreign] = relationship;
  return (
    (local.ns === namespace &&
      local.fields !== null &&
      isSameFieldOrChild(local.fields, fieldPath)) ||
    (foreign.ns === namespace &&
      foreign.fields !== null &&
      isSameFieldOrChild(foreign.fields, fieldPath))
  );
}
