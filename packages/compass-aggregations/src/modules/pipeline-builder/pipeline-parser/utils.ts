import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'mongodb';
import { prettify } from '@mongodb-js/compass-editor';
import type { FormatOptions } from '@mongodb-js/compass-editor';

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

export function generate(ast: Node, formatOptions?: FormatOptions) {
  return prettify(
    babelGenerate(ast).code,
    'javascript-expression',
    formatOptions,
  );
}

/**
 * @param source expression source (object or array expression with optional
 *               leading / trailing comments)
 */
export function parseShellBSON(source: string): Document[] {
  const parsed = _parseShellBSON(source, { mode: ParseMode.Loose });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('Source expression is invalid');
  }
  return parsed;
}

export { prettify } from '@mongodb-js/compass-editor';
