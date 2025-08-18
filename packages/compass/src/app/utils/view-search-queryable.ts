export const isPipelineSearchQueryable = (
  pipeline: Array<Record<string, any>>
): boolean => {
  for (const stage of pipeline) {
    const stageKey = Object.keys(stage)[0];

    // Check if the stage is $addFields, $set, or $match
    if (
      !(
        stageKey === '$addFields' ||
        stageKey === '$set' ||
        stageKey === '$match'
      )
    ) {
      return false;
    }

    // If the stage is $match, check if uses $expr
    if (stageKey === '$match') {
      const matchStage = stage['$match'];
      const matchKeys = Object.keys(matchStage);

      if (!(matchKeys.length === 1 && matchKeys.includes('$expr'))) {
        return false;
      }
    }
  }

  return true;
};
