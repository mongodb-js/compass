import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';
import { prettify } from '@mongodb-js/compass-editor';
import type { FormatOptions } from '@mongodb-js/compass-editor';
import {
  StageAssertionErrorCodes,
  type StageAssertionErrorCode,
} from './stage-parser';

type ErrorLoc = {
  line: number;
  column: number;
  index?: number;
};

export class PipelineParserError extends SyntaxError {
  loc?: ErrorLoc;
  code?: StageAssertionErrorCode;
  constructor(message: string, loc?: ErrorLoc, code?: StageAssertionErrorCode) {
    super(message);
    this.loc = loc;
    this.code = code;
  }
}

export function generate(ast: Node, formatOptions?: FormatOptions) {
  return prettify(
    babelGenerate(ast).code,
    'javascript-expression',
    formatOptions
  );
}

/**
 * @param source expression source (object or array expression with optional
 *               leading / trailing comments)
 */
export async function parseShellBSON<T = unknown>(source: string): Promise<T> {
  try {
    return await parse(source, {
      mode: ParseMode.Strict,
      allowComments: true,
      allowMethods: true,
    });
  } catch (error) {
    const { loc, pos } = error as { loc?: ErrorLoc; pos?: number };
    throw new PipelineParserError(
      (error as Error).message,
      loc && { line: loc.line, column: loc.column, index: pos },
      StageAssertionErrorCodes.InvalidStageValue
    );
  }
}

export { prettify } from '@mongodb-js/compass-editor';
