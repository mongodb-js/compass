import { StringMap } from '../interfaces';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Replaces all occurences of keys in a string and writes the result to disk.
 *
 * @param {string} input
 * @param {string} target
 * @param {StringMap<string>} replacements
 * @returns {Promise<void>}
 */
export async function replaceToFile(input: string,
                                    target: string,
                                    replacements: StringMap<string>): Promise<string> {
  const output = replaceInString(input, replacements);
  await fs.outputFile(target, output, 'utf-8');
  return output;
}

/**
 * Replaces all occurences of keys in a string. Uses a string map to replace elements.
 *
 * @param {string} source
 * @param {StringMap<string>} replacements
 * @returns {string}
 */
export function replaceInString(source: string, replacements: StringMap<string>): string {
  let output = source;

  Object.keys(replacements).forEach((key) => {
    const regex = new RegExp(key, 'g');
    output = output.replace(regex, replacements[key]);
  });

  return output;
}
