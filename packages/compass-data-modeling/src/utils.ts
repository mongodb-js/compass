import toNS from 'mongodb-ns';
import type { Relationship } from './services/data-model-storage';

export function getRelationshipName({
  relationship,
  name,
}: Relationship): string {
  if (name) return name;
  const coll1 = relationship[0].ns ? toNS(relationship[0].ns).collection : '';
  const coll2 = relationship[1].ns ? toNS(relationship[1].ns).collection : '';
  return [coll1, coll2].join(` \u2192 `).trim();
}
