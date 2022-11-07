import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';

export function prettify(
  code: string,
  parser: 'expression' | 'block' = 'expression'
) {
  return prettier
    .format(code, {
      plugins: [parserBabel],
      printWidth: 50,
      // Default babel parser in prettier only understands statements /
      // "programms" well, formatting something like `{ foo: 1 }` by default
      // will format it as a block with labels. As all the code that we will
      // format will mostly be expressions, we use internal `__js_expression`
      // parser instead of default `babel` here when parser is not set
      parser: parser === 'expression' ? '__js_expression' : 'babel',
    })
    .trim();
}
