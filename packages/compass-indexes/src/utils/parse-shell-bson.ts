import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';

export async function parseShellBSON(source: string): Promise<unknown> {
  return await parse(source, {
    mode: ParseMode.Strict,
    allowComments: true,
    allowMethods: true,
  });
}
