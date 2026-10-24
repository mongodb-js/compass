import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';

export async function countAggregationStagesInString(
  source: string
): Promise<number> {
  const parsed = await parse(source, {
    mode: ParseMode.Strict,
    allowComments: true,
    allowMethods: true,
  });
  if (!Array.isArray(parsed)) {
    throw new Error('Source expression is not an aggregation stage array');
  }
  return parsed.length;
}
