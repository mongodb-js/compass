import { ADL, ATLAS } from '@mongodb-js/mongodb-constants';
import {
  PerformanceSignals,
  type Signal,
} from '@mongodb-js/compass-components';
import type { StoreStage } from '../modules/pipeline-builder/stage-editor';

export const getInsightForStage = (
  { stageOperator, value }: StoreStage,
  env: string
): Signal | undefined => {
  const isAtlas = [ATLAS, ADL].includes(env);
  if (stageOperator === '$match' && /\$(text|regex)\b/.test(value ?? '')) {
    return isAtlas
      ? PerformanceSignals.get('atlas-text-regex-usage-in-stage')
      : PerformanceSignals.get('non-atlas-text-regex-usage-in-stage');
  }
  if (stageOperator === '$lookup') {
    return PerformanceSignals.get('lookup-in-stage');
  }
};
