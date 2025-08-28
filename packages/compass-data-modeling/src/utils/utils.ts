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
  if (ancestor.length === child.length)
    return areFieldPathsEqual(ancestor, child);
  if (ancestor.length > child.length) return false;
  // ignore the last character - closing bracket
  const ancestorPath = JSON.stringify(ancestor).slice(0, -1);
  const beginningOfChildPath = JSON.stringify(child).slice(
    0,
    ancestorPath.length
  );
  return ancestorPath === beginningOfChildPath;
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
