import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import prettier from 'prettier';

export class PipelineParserError extends SyntaxError {
  loc?: {
    line: number;
    column: number;
  }
};

export function generate(ast: Node) {
  return prettier
    .format(babelGenerate(ast).code, {
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
