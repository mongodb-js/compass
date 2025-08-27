import type { FieldPath, Relationship } from '../services/data-model-storage';

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
  if (ancestor.length === child.length)
    return areFieldPathsEqual(ancestor, child);
  if (ancestor.length > child.length) return false;
  const pathAncestor = JSON.stringify(ancestor);
  const pathChild = JSON.stringify(child);
  // ignore the last character - closing bracket
  return (
    pathAncestor.slice(0, pathAncestor.length - 1) ===
    pathChild.slice(0, pathAncestor.length - 1)
  );
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
