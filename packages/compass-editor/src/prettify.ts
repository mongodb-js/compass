import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import type { Options as PrettierFormatOptions } from 'prettier';

export type FormatOptions = Omit<PrettierFormatOptions, 'plugin' | 'parser'>;

export function prettify(
  code: string,
  parser:
    | 'javascript-expression'
    | 'javascript'
    | 'json' = 'javascript-expression',
  formatOptions: FormatOptions = {}
) {
  return prettier
    .format(code, {
      plugins: [parserBabel],
      printWidth: 50,
      parser:
        parser === 'javascript-expression'
          ? // Default babel parser in prettier only understands statements /
            // "programms" well, formatting something like `{ foo: 1 }` by default
            // will format it as a block with labels. As all the code that we will
            // format will mostly be expressions, we use internal `__js_expression`
            // parser instead of default `babel` for this case
            '__js_expression'
          : parser === 'json'
          ? 'json'
          : 'babel',
      ...formatOptions,
    })
    .trim();
}
