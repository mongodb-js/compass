import type { Document } from 'mongodb';

export const isPipelineSearchQueryable = (pipeline: Document[]): boolean => {
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

    // If the stage is $match, check if it uses $expr
    if (stageKey === '$match') {
      const matchStage = stage['$match'] as Document;
      const matchKeys = Object.keys(matchStage || {});

      if (!(matchKeys.length === 1 && matchKeys.includes('$expr'))) {
        return false;
      }
    }
  }

  return true;
};
