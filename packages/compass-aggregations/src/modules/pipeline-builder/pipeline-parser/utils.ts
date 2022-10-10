import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import prettier from 'prettier';

export function generate(ast: Node) {
  return prettier
    .format(babelGenerate(ast).code, {
      printWidth: 60,
      parser: '__js_expression'
    })
    .trim();
}
