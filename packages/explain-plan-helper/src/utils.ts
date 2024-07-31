import parse, { ParseMode } from '@mongodb-js/shell-bson-parser';
import type { Stage } from '.';
//github.com/mongodb-js/compass/pull/6071/commits/5f47eebb58485a0f7cc697c317f4d5e2890ae17c
export function getStageIndexFields(stage: Stage): Record<string, string> {
  if (
    stage.stage === 'EXPRESS_IXSCAN' &&
    typeof stage.keyPattern === 'string'
  ) {
    // For EXPRESS stages, the keyPattern is a string, which is not valid json.
    try {
      const result = parse(stage.keyPattern, { mode: ParseMode.Loose });
      return typeof result === 'string' ? {} : result;
    } catch (e) {
      return {};
    }
  }
  return stage.keyPattern ?? {};
}
