import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import prettier from 'prettier';

type ErrorLoc = {
  line: number;
  column: number;
}
export class PipelineParserError extends SyntaxError {
  loc: ErrorLoc | undefined;
};

export function generate(ast: Node) {
  return prettify(babelGenerate(ast).code);
}

export function prettify(code: string) {
  return prettier
    .format(code, {
      printWidth: 60,
      // Prettier only understands statements, so we use internal
      // expression parser (it's just babel.parseExpression instead of
      // babel.parse) as all our cases are for formatting expressions
      //
      // TODO: Would be good to use our version of babel here, but currently
      // this fails. Requires to dig a bit deeper into how the custom parsers
      // work
      parser: '__js_expression'
    })
    .trim();
}
