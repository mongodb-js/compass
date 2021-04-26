/* eslint-disable complexity */
import * as babel from '@babel/core';
import * as BabelTypes from '@babel/types';

/**
 * First-step transform plugin: Wrap the entire program inside a function,
 * and re-export variables.
 *
 * ```js
 * function foo() { return db.test.find(); }
 * class A {}
* foo()```
 *
 * is converted into roughly:
 * ```js
 * var A;
 *
 * function foo() {
 *   return db.test.find();
 * }
 *
 * (() => {
 *   A = class A {};
 *   return foo();
 * })();
 * ```
 *
 * This is necessary because the second transformation step only works with
 * functions, not top-level program code.
 *
 * It is also 'nice' in the sense that it converts 'let' and 'const' variable
 * declarations into 'var' declarations, which is usually not something one
 * wants to do in JS, but for REPLs it actually increases usability a lot.
 */

type WrapState = {
  // All statements moved from the Program-level scope into the new function.
  movedStatements: babel.types.Statement[];
  // All function declarations. These have to be moved to the outermost scope
  // in order to allow for proper hoisting semantics.
  functionDeclarations: babel.types.FunctionDeclaration[];
  // Whether the function-creating part has completed.
  hasFinishedMoving: boolean;
  // A list of all variables names that have been moved to outside of the function.
  variables: string[];
  // Whether the conversion of completion records into return statements already took place.
  addedCompletionRecords: boolean;
  // The identifier used for returning the completion record
  completionRecordId: babel.types.Identifier;
};

export default ({ types: t }: { types: typeof BabelTypes }): babel.PluginObj<WrapState> => {
  function asNodeKey(v: any): keyof babel.types.Node { return v; }
  const excludeFromCompletion = asNodeKey(Symbol('excludedFromCompletion'));
  return {
    pre() {
      this.movedStatements = [];
      this.functionDeclarations = [];
      this.hasFinishedMoving = false;
      this.addedCompletionRecords = false;
      this.variables = [];
    },
    visitor: {
      Statement(path): void {
        if (this.hasFinishedMoving) return;
        if (path.isDeclaration() && !path.getFunctionParent()) {
          // The complicated case: We've encountered a variable/function/class
          // declaration.
          if (path.isVariableDeclaration()) {
            if (path.parentPath.isProgram() || path.node.kind === 'var') {
              // We turn variables into outermost-scope variables if they are
              // a) hoisted 'var's with no function parent or b) let/const
              // at the top-level (i.e. no block scoping).
              const asAssignments = [];
              for (const decl of path.node.declarations) {
                // Copy variable names.
                this.variables.push((decl.id as babel.types.Identifier).name);
                if (decl.init !== null) {
                  // If there is an initializer for this variable, turn it into
                  // an assignment expression.
                  const expr = t.assignmentExpression('=', decl.id, decl.init);
                  if (path.node.kind !== 'var') {
                    Object.assign(expr, { [excludeFromCompletion]: true });
                  }
                  asAssignments.push(t.expressionStatement(expr));
                }
              }
              if (path.parentPath.isProgram()) {
                this.movedStatements.push(...asAssignments);
                path.remove();
              } else {
                path.replaceWithMultiple(asAssignments);
              }
              return;
            }
          } else if (path.isFunctionDeclaration()) {
            // Move top-level functions separately for hoisting.
            this.functionDeclarations.push(path.node);
            if (path.node.id) {
              path.replaceWith(t.expressionStatement(path.node.id));
            } else {
              // Unsure how to reach this, but babel says the type of
              // FunctionDeclaration['id'] is 'Identifier | null'.
              path.remove();
            }
            return;
          } else if (path.isClassDeclaration() && path.parentPath.isProgram()) {
            // Convert this declaration into an assignment expression, i.e.
            // `class A {}` becomes `A = class A {}`.
            // Unlike `var`
            this.variables.push(path.node.id.name);
            this.movedStatements.push(
              t.expressionStatement(
                t.assignmentExpression('=', path.node.id,
                  t.classExpression(
                    path.node.id, path.node.superClass, path.node.body))));
            path.replaceWith(t.expressionStatement(path.node.id));
            return;
          }
        }
        // All other declarations are currently either about TypeScript
        // or ES modules. We treat them like non-declaration statements here
        // and move them into the generated IIFE.
        if (path.parentPath.isProgram()) {
          this.movedStatements.push(path.node);
        }
      },
      Program: {
        enter(path) {
          // If the body of the program consists of a single string literal,
          // we want to intepret it as such and not as a a directive (that is,
          // a "use strict"-like thing).
          if (path.node.directives.length === 1 &&
              path.node.directives[0].value.type === 'DirectiveLiteral') {
            path.replaceWith(t.program([
              t.expressionStatement(
                t.stringLiteral(path.node.directives[0].value.value))
            ]));
          }
        },
        exit(path): void {
          // Once we are done gathering all statements and variables,
          // create a program that has a list of variables and the rest of the
          // code inside an IIFE.
          if (this.hasFinishedMoving) return;
          this.hasFinishedMoving = true;
          this.completionRecordId = path.scope.generateUidIdentifier('cr');
          this.movedStatements.unshift(
            t.variableDeclaration('var', [t.variableDeclarator(this.completionRecordId)]));
          path.replaceWith(t.program([
            ...this.variables.map(
              v => t.variableDeclaration('var', [t.variableDeclarator(t.identifier(v))])),
            ...this.functionDeclarations,
            t.expressionStatement(t.callExpression(
              t.arrowFunctionExpression(
                [],
                t.blockStatement(this.movedStatements)
              ), []))]));
        }
      },
      BlockStatement: {
        exit(path): void {
          if (!this.hasFinishedMoving) return;
          // After creating the function, we look for completion records and
          // turn them into return statements. This applies only to body of
          // the single top-level function that we just created.
          if (!path.parentPath.isArrowFunctionExpression()) return;
          if (path.parentPath.getFunctionParent()) return;
          if (this.addedCompletionRecords) return;
          this.addedCompletionRecords = true;
          const records = path.getCompletionRecords();
          for (const record of records) {
            // ExpressionWrapper = ExpressionStatement | ParenthesizedExpression
            if (record.isExpressionWrapper() && !record.node.expression[excludeFromCompletion]) {
              record.replaceWith(t.expressionStatement(
                t.assignmentExpression('=', this.completionRecordId, record.node.expression)));
            }
          }
          path.replaceWith(t.blockStatement([
            ...path.node.body,
            t.returnStatement(this.completionRecordId)
          ]));
        }
      }
    }
  };
};
