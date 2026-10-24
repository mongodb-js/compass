import parse, { ParseMode } from '@mongodb-js/shell-bson-parser';
import type { Stage } from '.';
export async function getStageIndexFields(
  stage: Stage
): Promise<Record<string, string>> {
  if (
    stage.stage === 'EXPRESS_IXSCAN' &&
    typeof stage.keyPattern === 'string'
  ) {
    // For EXPRESS stages, the keyPattern is a string, which is not valid json.
    // TODO(COMPASS-10806): This was fixed in 9.0. Currently it has not been
    // backported, so we will keep this workaround for now.
    try {
      const result = await parse(stage.keyPattern, {
        mode: ParseMode.Strict,
      });
      return typeof result === 'string' ? {} : result;
    } catch {
      return {};
    }
  }
  return stage.keyPattern ?? {};
}
