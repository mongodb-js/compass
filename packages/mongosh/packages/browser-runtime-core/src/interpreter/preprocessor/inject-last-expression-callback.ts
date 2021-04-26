import template from '@babel/template';
import type { File, ExpressionStatement, ClassDeclaration, FunctionDeclaration } from '@babel/types';

export function injectLastExpressionCallback(callbackFunctionName: string, ast: File): File {
  const capture = template.statement(`${callbackFunctionName}(%%expression%%)`);
  const last = ast.program.body[ast.program.body.length - 1];
  const type = last && last.type;

  switch (type) {
    case 'ClassDeclaration':
    case 'FunctionDeclaration':
      ast.program.body.push(capture({
        expression: (last as ClassDeclaration | FunctionDeclaration).id
      }));
      break;

    case 'ExpressionStatement':
      ast.program.body[ast.program.body.length - 1] = capture({
        expression: (last as ExpressionStatement).expression
      });

      break;

    default:
      ast.program.body.push(capture({ expression: null }));
  }

  return ast;
}
