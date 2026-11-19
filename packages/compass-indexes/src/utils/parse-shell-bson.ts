import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';

export async function parseShellBSON(source: string): Promise<unknown> {
  const parsed = await parse(source, {
    mode: ParseMode.Strict,
    allowComments: true,
    allowMethods: true,
  });
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('The provided index definition is invalid.');
  }
  return parsed;
}
