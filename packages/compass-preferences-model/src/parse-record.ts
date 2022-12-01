import { inspect } from 'util';
import { URLSearchParams } from 'url';

// Parse a JS array or object into a list of key-value pairs.
// See the test file for example supported formats (notably, this
// includes typical yaml input and yargs' format for CLI options).
export function parseRecord(
  input: unknown,
  error: (message: string) => void
): [key: string, value: string][] {
  if (typeof input === 'string') {
    return [...new URLSearchParams(input)];
  }

  if (!input) {
    return [];
  }

  if (typeof input !== 'object' || input === null) {
    error(`Could not interpret ${inspect(input)} as a list of key-value pairs`);
    return [];
  }

  const rawResult: [unknown, unknown][] = [];
  if (Array.isArray(input)) {
    for (const value of input as unknown[]) {
      if (Array.isArray(value) && value.length === 2) {
        rawResult.push([value[0], value[1]]);
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        for (const [key, innerValue] of Object.entries(value)) {
          rawResult.push([key, innerValue]);
        }
      } else {
        error(`Could not interpret ${inspect(value)} as a key-value pair`);
      }
    }
  } else {
    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value)) {
        for (const innerValue of value) {
          rawResult.push([key, innerValue]);
        }
      } else {
        rawResult.push([key, value]);
      }
    }
  }

  const result: [string, string][] = [];
  for (const [key, value] of rawResult) {
    if (typeof key === 'object' && key !== null) {
      error(`Could not interpret ${inspect(key)} as a record key`);
    } else if (typeof value === 'object' && value !== null) {
      error(`Could not interpret ${inspect(value)} as a string value`);
    } else {
      result.push([String(key), String(value)]);
    }
  }
  return result;
}
