import decomment from 'decomment';
import ejsonShellParser from 'ejson-shell-parser';

export function extractDelimitedText(str: string, delimiter: string): string {
  if (!str.includes(`<${delimiter}>`)) {
    return '';
  }

  let res = str;
  try {
    res = str.split(`<${delimiter}>`)[1].split(`</${delimiter}>`)[0];
  } catch (e) {
    return '';
  }

  return res;
}

export const parseShellString = (shellSyntaxString?: string) => {
  if (shellSyntaxString === null || shellSyntaxString === undefined) {
    return shellSyntaxString;
  }

  const parsed = ejsonShellParser(decomment(shellSyntaxString).trim());

  if (!parsed) {
    throw new Error(`Failed to parse shell syntax: \n"${shellSyntaxString}"`);
  }

  return parsed;
};
