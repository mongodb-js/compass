import type { Stage } from '.';

export function getStageIndexFields(stage: Stage): Record<string, string> {
  if (
    stage.stage === 'EXPRESS_IXSCAN' &&
    typeof stage.keyPattern === 'string'
  ) {
    // TODO (SERVER-92981): For EXPRESS stages, the keyPattern is a string, which is not valid json.
    try {
      return JSON.parse(stage.keyPattern);
    } catch (e) {
      try {
        return JSON.parse(stage.keyPattern.replace(/(\w+):/g, '"$1":'));
      } catch (e) {
        return {};
      }
    }
  }
  return stage.keyPattern ?? {};
}
