import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';
import { type ConfigurationParameters } from '@mongodb-js/compass-components';

export function mapAtlasConnectionDebugResult(
  result: AtlasConnectionDebugResult
): ConfigurationParameters {
  return [
    { key: 'Cluster', value: result.cluster || 'N/A' },
    { key: 'State', value: (result.clusterState ?? 'N/A').toUpperCase() },
    {
      key: 'IP Access',
      value: result.ipAccessAllowed
        ? 'Client IP allowed'
        : 'Client IP not allowed',
    },
  ];
}
