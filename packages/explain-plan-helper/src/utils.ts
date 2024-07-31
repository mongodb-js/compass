import parse, { ParseMode } from '@mongodb-js/shell-bson-parser';
import type { Stage } from '.';

export function getStageIndexFields(stage: Stage): Record<string, string> {
  if (
    stage.stage === 'EXPRESS_IXSCAN' &&
    typeof stage.keyPattern === 'string'
  ) {
    // TODO (SERVER-92981): For EXPRESS stages, the keyPattern is a string, which is not valid json.
    try {
      const result = parse(stage.keyPattern, { mode: ParseMode.Loose });
      return typeof result === 'string' ? {} : result;
    } catch (e) {
      return {};
    }
  }
  return stage.keyPattern ?? {};
}
