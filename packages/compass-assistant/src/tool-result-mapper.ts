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

export function mapAtlasConnectionDebugResult(
  result: AtlasConnectionDebugResult
): ToolResultFields {
  return [
    {
      type: 'link',
      label: 'Cluster',
      value: result.cluster || 'N/A',
      href: `https://cloud.mongodb.com/`,
    },
    {
      type: 'text',
      label: 'State',
      value: (result.clusterState || 'N/A').toUpperCase(),
    },
    {
      type: 'text',
      label: 'IP Access',
      value: result.ipAccessAllowed
        ? 'Client IP allowed'
        : 'Client IP not allowed',
    },
  ];
}
