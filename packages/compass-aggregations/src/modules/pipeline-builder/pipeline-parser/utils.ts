import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import prettier from 'prettier';
import _parseEJSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'mongodb';

type ErrorLoc = {
  line: number;
  column: number;
}
export class PipelineParserError extends SyntaxError {
  loc: ErrorLoc | undefined;
  constructor(message: string, loc?: ErrorLoc) {
    super(message);
    this.loc = loc;
  }
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

/**
 * @param source expression source (object or array expression with optional
 *               leading / trailing comments)
 */
export function parseEJSON(source: string): Document[] {
  const parsed = _parseEJSON(source, { mode: ParseMode.Loose });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('Source expression is invalid');
  }
  return parsed;
}
