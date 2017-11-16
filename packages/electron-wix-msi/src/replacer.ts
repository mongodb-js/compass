import { StringMap } from './interfaces';
import * as fs from 'fs-extra';
import * as path from 'path';

export async function replaceInFile(source: string, target: string, replacements: StringMap<string>) {
  if (!fs.existsSync(source)) {
    throw new Error(`Could not find source file at ${source}`);
  }

  const input = await fs.readFile(path.normalize(source), 'utf-8');
  const output = replaceInString(input, replacements);

  await fs.outputFile(target, output, 'utf-8');
}

export function replaceInString(source: string, replacements: StringMap<string>) {
  let output = source;

  Object.keys(replacements).forEach((key) => {
    const regex = new RegExp(key, 'g');
    output = output.replace(regex, replacements[key]);
  });

  return output;
}
