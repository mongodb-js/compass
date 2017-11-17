import { StringMap } from './interfaces';
import * as fs from 'fs-extra';
import * as path from 'path';

export async function replaceToFile(input: string, target: string, replacements: StringMap<string>) {
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
