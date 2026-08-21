import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';

/**
 * A single field to display in a custom tool result. The `type` discriminant
 * controls how the value is rendered, and can be extended with new variants
 * (e.g. 'badge', 'code') without changing the renderer's call sites.
 */
export type ToolResultField =
  | { type: 'text'; label: string; value: string }
  | { type: 'link'; label: string; value: string; href: string };

export type ToolResultFields = ToolResultField[];

function getResultContent({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}): ToolResultField {
  return href
    ? { type: 'link', label, value, href }
    : { type: 'text', label, value };
}

export function mapAtlasConnectionDebugResult(
  result: AtlasConnectionDebugResult
): ToolResultFields {
  return [
    {
      label: 'Cluster',
      value: result.clusterName,
      href: result.links?.clusterOverview,
    },
    {
      label: 'State',
      value: result.clusterState,
    },
    {
      label: 'IP Access',
      value: result.ipAccessStatus,
      href: result.links?.networkAccessList,
    },
  ].map(getResultContent);
}
