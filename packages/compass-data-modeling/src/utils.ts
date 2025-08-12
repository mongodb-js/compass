import toNS from 'mongodb-ns';
import type { Relationship } from './services/data-model-storage';

export function getDefaultRelationshipName(
  relationship: Relationship['relationship']
): string {
  const [local, foreign] = relationship;
  let localLabel = '';
  let foreignLabel = '';
  if (local.ns) {
    localLabel += toNS(local.ns).collection;
    if (local.fields && local.fields.length) {
      localLabel += `.${local.fields.join('.')}`;
    }
  }
  if (foreign.ns) {
    foreignLabel += toNS(foreign.ns).collection;
    if (foreign.fields && foreign.fields.length) {
      foreignLabel += `.${foreign.fields.join('.')}`;
    }
  }
  return [localLabel, foreignLabel].join(` \u2192 `).trim();
}
