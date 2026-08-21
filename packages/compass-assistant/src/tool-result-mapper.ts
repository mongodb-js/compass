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

function linkOrText(
  label: string,
  value: string,
  href?: string
): ToolResultField {
  return href
    ? { type: 'link', label, value, href }
    : { type: 'text', label, value };
}

export function mapAtlasConnectionDebugResult(
  result: AtlasConnectionDebugResult
): ToolResultFields {
  return [
    linkOrText('Cluster', result.clusterName, result.links?.clusterOverview),
    {
      type: 'text',
      label: 'State',
      value: result.clusterState,
    },
    linkOrText(
      'IP Access',
      result.ipAccessStatus,
      result.links?.networkAccessList
    ),
  ];
}
