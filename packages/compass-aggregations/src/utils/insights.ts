import { ADL, ATLAS } from '@mongodb-js/mongodb-constants';
import {
  PerformanceSignals,
  type Signal,
} from '@mongodb-js/compass-components';
import type { StoreStage } from '../modules/pipeline-builder/stage-editor';
import type { ServerEnvironment } from '../modules/env';

export const getInsightForStage = (
  { stageOperator, value }: StoreStage,
  env: ServerEnvironment,
  isSearchIndexesSupported: boolean,
  onCreateSearchIndex: () => void
): Signal | undefined => {
  const isAtlas = [ATLAS, ADL].includes(env);
  if (stageOperator === '$match' && /\$(text|regex)\b/.test(value ?? '')) {
    if (isAtlas) {
      return isSearchIndexesSupported
        ? {
            ...PerformanceSignals.get(
              'atlas-with-search-text-regex-usage-in-stage'
            ),
            onPrimaryActionButtonClick: onCreateSearchIndex,
          }
        : PerformanceSignals.get(
            'atlas-without-search-text-regex-usage-in-stage'
          );
    }
    return PerformanceSignals.get('non-atlas-text-regex-usage-in-stage');
  }
  if (stageOperator === '$lookup') {
    return PerformanceSignals.get('lookup-in-stage');
  }
};
