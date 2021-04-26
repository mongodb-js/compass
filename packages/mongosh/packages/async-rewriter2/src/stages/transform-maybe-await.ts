/* eslint-disable complexity */
import * as babel from '@babel/core';
import * as BabelTypes from '@babel/types';

/**
 * The second step that performs the heavy lifting of turning regular functions
 * into maybe-async-maybe-not functions.
 *
 * This consists of two main components:
 *
 * 1. A function meta-wrapper, where an original (non-async) function is
 *    converted into an async function and is placed (as an "inner" function)
 *    into the body of another function and is wrapper. If the inner function
 *    returns (or throws) synchronously, the outer function also return
 *    synchronously. If not, the return value is marked as a Promise that should
 *    implicitly be awaited in other rewritten code.
 *
 * 2. An expression wrapper, which looks at expressions inside the original
 *    function body, and inserts code that dynamically decides whether to await
 *    the expressions it encounters or not at runtime.
 *
 * The README file has more complete code snippets.
 */

interface AsyncFunctionIdentifiers {
  functionState: babel.types.Identifier;
  synchronousReturnValue: babel.types.Identifier;
  asynchronousReturnValue: babel.types.Identifier;
  expressionHolder: babel.types.Identifier;
  markSyntheticPromise: babel.types.Identifier;
  isSyntheticPromise: babel.types.Identifier;
  syntheticPromiseSymbol: babel.types.Identifier;
  demangleError: babel.types.Identifier;
  assertNotSyntheticPromise: babel.types.Identifier;
}

export default ({ types: t }: { types: typeof BabelTypes }): babel.PluginObj<{ file: babel.types.File }> => {
  // We mark certain AST nodes as 'already visited' using these symbols.
  function asNodeKey(v: any): keyof babel.types.Node { return v; }
  const isGeneratedInnerFunction = asNodeKey(Symbol('isGeneratedInnerFunction'));
  const isGeneratedHelper = asNodeKey(Symbol('isGeneratedHelper'));
  const isOriginalBody = asNodeKey(Symbol('isOriginalBody'));
  const isAlwaysSyncFunction = asNodeKey(Symbol('isAlwaysSyncFunction'));
  const isExpandedTypeof = asNodeKey(Symbol('isExpandedTypeof'));
  // Using this key, we store data on Function nodes that contains the identifiers
  // of helpers which are available inside the function.
  const identifierGroupKey = '@@mongosh.identifierGroup';

  // We fetch the symbol constructor as
  //   Object.getOwnPropertySymbols(Array.prototype)[0].constructor
  // because Symbol refers to BSONSymbol inside the target mongosh context.
  // (This is the only mongosh-specific hack in here.)
  const symbolConstructor = babel.template.expression(`
    Object.getOwnPropertySymbols(Array.prototype)[0].constructor
  `)();

  const syntheticPromiseSymbolTemplate = babel.template.statement(`
    const SP_IDENTIFIER = SYMBOL_CONSTRUCTOR.for("@@mongosh.syntheticPromise");
  `);

  const markSyntheticPromiseTemplate = babel.template.statement(`
    function MSP_IDENTIFIER(p) {
      return Object.defineProperty(p, SP_IDENTIFIER, {
        value: true
      });
    }
  `);

  const isSyntheticPromiseTemplate = babel.template.statement(`
    function ISP_IDENTIFIER(p) {
      return p && p[SP_IDENTIFIER];
    }
  `);

  const assertNotSyntheticPromiseTemplate = babel.template.statement(`
    function ANSP_IDENTIFIER(p, s) {
      if (p && p[SP_IDENTIFIER]) {
        throw new CUSTOM_ERROR_BUILDER(
          'Result of expression "' + s + '" cannot be used in this context',
          'SyntheticPromiseInAlwaysSyncContext');
      }
      return p;
    }
  `);

  const asyncTryCatchWrapperTemplate = babel.template.expression(`
    async () => {
      try {
        ORIGINAL_CODE;
      } catch (err) {
        if (FUNCTION_STATE_IDENTIFIER === "sync") {
          SYNC_RETURN_VALUE_IDENTIFIER = err;
          FUNCTION_STATE_IDENTIFIER = "threw";
        } else throw err;
      } finally {
        if (FUNCTION_STATE_IDENTIFIER !== "threw") FUNCTION_STATE_IDENTIFIER = "returned";
      }
    }
  `);

  const expressionHolderVariableTemplate = babel.template.statement(`
    let EXPRESSION_HOLDER_IDENTIFIER;`);

  const wrapperFunctionTemplate = babel.template.statements(`
    let FUNCTION_STATE_IDENTIFIER = "sync",
        SYNC_RETURN_VALUE_IDENTIFIER;

    const ASYNC_RETURN_VALUE_IDENTIFIER = (ASYNC_TRY_CATCH_WRAPPER)();

    if (FUNCTION_STATE_IDENTIFIER === "returned")
      return SYNC_RETURN_VALUE_IDENTIFIER;
    else if (FUNCTION_STATE_IDENTIFIER === "threw")
      throw SYNC_RETURN_VALUE_IDENTIFIER;
    FUNCTION_STATE_IDENTIFIER = "async";
    return MSP_IDENTIFIER(ASYNC_RETURN_VALUE_IDENTIFIER);
  `);

  const awaitSyntheticPromiseTemplate = babel.template.expression(`(
    ORIGINAL_SOURCE,
    EXPRESSION_HOLDER = NODE,
    ISP_IDENTIFIER(EXPRESSION_HOLDER) ? await EXPRESSION_HOLDER : EXPRESSION_HOLDER
  )`, {
    allowAwaitOutsideFunction: true
  });

  const assertNotSyntheticExpressionTemplate = babel.template.expression(`
    ANSP_IDENTIFIER(NODE, ORIGINAL_SOURCE)
  `);

  const rethrowTemplate = babel.template.statement(`
    try {
      ORIGINAL_CODE;
    } catch (err) {
      throw err;
    }
  `);

  // If we encounter an error object, we fix up the error message from something
  // like `("a" , foo(...)(...)) is not a function` to `a is not a function`.
  // For that, we look for a) the U+FEFF markers we use to tag the original source
  // code with, and b) drop everything else in this parenthesis group (this uses
  // the fact that currently, parentheses in error messages are nested at most
  // two levels deep, which makes it something that we can tackle with regexps).
  const demangleErrorTemplate = babel.template.statement(String.raw `
    function DE_IDENTIFIER(err) {
      if (Object.prototype.toString.call(err) === '[object Error]' &&
          err.message.includes('\ufeff')) {
        err.message = err.message.replace(/\(\s*"\ufeff(.+?)\ufeff"\s*,(?:[^\(]|\([^\)]*\))*\)/g, '$1');
      }
      return err;
    }
  `, { placeholderPattern: false, placeholderWhitelist: new Set(['DE_IDENTIFIER']) });

  const returnValueWrapperTemplate = babel.template.expression(`(
    SYNC_RETURN_VALUE_IDENTIFIER = NODE,
    FUNCTION_STATE_IDENTIFIER === 'async' ? SYNC_RETURN_VALUE_IDENTIFIER : null
  )`);

  return {
    pre(file: babel.types.File) {
      this.file = file;
    },
    visitor: {
      BlockStatement(path) {
        // This might be a function body. If it's what we're looking for, wrap it.
        if (!path.parentPath.isFunction()) return;
        // Don't wrap things we've already wrapped.
        if (path.parentPath.getData(identifierGroupKey)) return;
        // Don't wrap the inner function we've created while wrapping another function.
        if (path.parentPath.node[isGeneratedInnerFunction]) return;
        // Don't wrap helper functions with async-rewriter-generated code.
        if (path.parentPath.node[isGeneratedHelper]) return;

        const originalSource = path.parent.start !== undefined ?
          (this.file as any).code.slice(path.parent.start, path.parent.end) :
          'function () { [unknown code] }';
        // Encode using UTF-16 + hex encoding so we don't have to worry about
        // special characters.
        const encodedOriginalSource =
          [...originalSource].map(char => char.charCodeAt(0).toString(16).padStart(4, '0')).join('');
        const originalSourceNode = t.expressionStatement(
          t.stringLiteral(`<async_rewriter>${encodedOriginalSource}</>`));

        // A parent function might have a set of existing helper methods.
        // If it does, we re-use the functionally equivalent ones.
        const existingIdentifiers: AsyncFunctionIdentifiers | null =
          path.findParent(path => !!path.getData(identifierGroupKey))?.getData(identifierGroupKey);

        // Generate and store a set of identifiers for helpers.
        const functionState = path.scope.generateUidIdentifier('fs');
        const synchronousReturnValue = path.scope.generateUidIdentifier('srv');
        const asynchronousReturnValue = path.scope.generateUidIdentifier('arv');
        const expressionHolder = existingIdentifiers?.expressionHolder ?? path.scope.generateUidIdentifier('ex');
        const markSyntheticPromise = existingIdentifiers?.markSyntheticPromise ?? path.scope.generateUidIdentifier('msp');
        const isSyntheticPromise = existingIdentifiers?.isSyntheticPromise ?? path.scope.generateUidIdentifier('isp');
        const assertNotSyntheticPromise = existingIdentifiers?.assertNotSyntheticPromise ?? path.scope.generateUidIdentifier('ansp');
        const syntheticPromiseSymbol = existingIdentifiers?.syntheticPromiseSymbol ?? path.scope.generateUidIdentifier('sp');
        const demangleError = existingIdentifiers?.demangleError ?? path.scope.generateUidIdentifier('de');
        const identifiersGroup: AsyncFunctionIdentifiers = {
          functionState,
          synchronousReturnValue,
          asynchronousReturnValue,
          expressionHolder,
          markSyntheticPromise,
          isSyntheticPromise,
          assertNotSyntheticPromise,
          syntheticPromiseSymbol,
          demangleError
        };
        path.parentPath.setData(identifierGroupKey, identifiersGroup);

        // We generate code that vaguely looks like and insert it at the top
        // of the wrapper function:
        // const syntheticPromise = Symbol.for('@mongosh.syntheticPromise');
        // function markSyntheticPromise(promise) {
        //   return Object.defineProperty(promise, syntheticPromise, { value: true });
        // }
        // function isSyntheticPromise(value) {
        //   return value && value[syntheticPromise];
        // }
        // Note that the last check potentially triggers getters and Proxy methods
        // and we may want to replace it by something a bit more sophisticated.
        // All of the top-level AST nodes here are marked as generated helpers.
        const commonHelpers = existingIdentifiers ? [] : [
          Object.assign(
            syntheticPromiseSymbolTemplate({
              SP_IDENTIFIER: syntheticPromiseSymbol,
              SYMBOL_CONSTRUCTOR: symbolConstructor
            }),
            { [isGeneratedHelper]: true }
          ),
          Object.assign(
            expressionHolderVariableTemplate({
              EXPRESSION_HOLDER_IDENTIFIER: expressionHolder
            }),
            { [isGeneratedHelper]: true }
          )
        ];
        const promiseHelpers = existingIdentifiers ? [] : [
          ...commonHelpers,
          Object.assign(
            markSyntheticPromiseTemplate({
              MSP_IDENTIFIER: markSyntheticPromise,
              SP_IDENTIFIER: syntheticPromiseSymbol
            }),
            { [isGeneratedHelper]: true }
          ),
          Object.assign(
            isSyntheticPromiseTemplate({
              ISP_IDENTIFIER: isSyntheticPromise,
              SP_IDENTIFIER: syntheticPromiseSymbol
            }),
            { [isGeneratedHelper]: true }
          ),
          Object.assign(
            demangleErrorTemplate({
              DE_IDENTIFIER: demangleError
            }),
            { [isGeneratedHelper]: true }
          )
        ];
        const syncFnHelpers = [
          ...commonHelpers,
          Object.assign(
            assertNotSyntheticPromiseTemplate({
              ANSP_IDENTIFIER: assertNotSyntheticPromise,
              SP_IDENTIFIER: syntheticPromiseSymbol,
              CUSTOM_ERROR_BUILDER: (this as any).opts.customErrorBuilder ?? t.identifier('Error')
            }),
            { [isGeneratedHelper]: true }
          )
        ];

        if (path.parentPath.node.async) {
          // If we are in an async function, no async wrapping is necessary.
          // We still want to have the runtime helpers available, and we add
          // a re-throwing try/catch around the body so that we can perform
          // error message adjustment through the CatchClause handler below.
          path.replaceWith(t.blockStatement([
            originalSourceNode,
            ...promiseHelpers,
            rethrowTemplate({
              ORIGINAL_CODE: path.node.body
            })
          ]));
          return;
        }

        // If we are in a non-async generator function, or a class constructor,
        // we throw errors for implicitly asynchronous expressions, because there
        // is just no good way to handle them (e.g.: What happens when you
        // subclass a class with a constructor that returns asynchronously?).
        if (path.parentPath.node.generator ||
            (path.parentPath.isClassMethod() &&
             path.parentPath.node.key.type === 'Identifier' &&
             path.parentPath.node.key.name === 'constructor')) {
          Object.assign(path.parentPath.node, { [isAlwaysSyncFunction]: true });
          path.replaceWith(t.blockStatement([
            originalSourceNode,
            ...syncFnHelpers,
            rethrowTemplate({
              ORIGINAL_CODE: path.node.body
            })
          ]));
          return;
        }

        const asyncTryCatchWrapper = Object.assign(
          asyncTryCatchWrapperTemplate({
            FUNCTION_STATE_IDENTIFIER: functionState,
            SYNC_RETURN_VALUE_IDENTIFIER: synchronousReturnValue,
            ORIGINAL_CODE: Object.assign(path.node, { [isOriginalBody]: true })
          }),
          { [isGeneratedInnerFunction]: true }
        );

        const wrapperFunction = wrapperFunctionTemplate({
          FUNCTION_STATE_IDENTIFIER: functionState,
          SYNC_RETURN_VALUE_IDENTIFIER: synchronousReturnValue,
          ASYNC_RETURN_VALUE_IDENTIFIER: asynchronousReturnValue,
          MSP_IDENTIFIER: markSyntheticPromise,
          ASYNC_TRY_CATCH_WRAPPER: asyncTryCatchWrapper
        });

        // Generate the wrapper function. See the README for a full code snippet.
        path.replaceWith(t.blockStatement([
          originalSourceNode,
          ...promiseHelpers,
          ...wrapperFunction
        ]));
      },
      UnaryExpression: {
        enter(path) {
          if (path.node.operator === 'typeof' && path.node.argument.type === 'Identifier' && !path.node[isExpandedTypeof]) {
            // 'typeof foo'-style checks have a double use; they not only report
            // the 'type' of an expression, but when used on identifiers, check
            // whether they have been declared, and if not, return 'undefined'.
            // This is annoying. We replace `typeof foo` with
            // `typeof foo === 'undefined' ? 'undefined' : typeof foo`.
            // The first `typeof foo` is marked as a generated helper and not
            // transformed any further, the second is transformed as usual.
            path.replaceWith(t.conditionalExpression(
              t.binaryExpression(
                '===',
                { ...path.node, [isGeneratedHelper]: true, [isExpandedTypeof]: true },
                t.stringLiteral('undefined')),
              t.stringLiteral('undefined'),
              { ...path.node, [isExpandedTypeof]: true }
            ));
          }
        }
      },
      Expression: {
        enter(path) {
          // Minor adjustment: When we encounter a 'shorthand' arrow function,
          // i.e. `(...args) => returnValueExpression`, we transform it into
          // one with a block body containing a single return statement.
          if (path.parentPath.isArrowFunctionExpression() && path.key === 'body') {
            path.replaceWith(t.blockStatement([
              t.returnStatement(path.node)
            ]));
          }
        },
        exit(path) {
          // We have seen an expression. If we're not inside an async function,
          // or a function that we explicitly marked as needing always-synchronous
          // treatment, we don't care.
          if (!path.getFunctionParent()) return;
          if (!path.getFunctionParent().node.async &&
              !path.getFunctionParent().node[isAlwaysSyncFunction]) return;
          // identifierGroup holds the list of helper identifiers available
          // inside this function.
          let identifierGroup: AsyncFunctionIdentifiers;
          if (path.getFunctionParent().node[isGeneratedInnerFunction]) {
            // We are inside a generated inner function. If there is no node
            // marked as [isOriginalBody] between it and the current node,
            // we skip this (for example, this applies to the catch and finally
            // blocks generated above).
            if (!path.findParent(
              path => path.isFunction() || !!path.node[isOriginalBody]
            ).node[isOriginalBody]) {
              return;
            }

            // We know that the outer function of the inner function has
            // helpers available.
            identifierGroup = path.getFunctionParent().getFunctionParent().getData(identifierGroupKey);
            if (path.parentPath.isReturnStatement() && !path.node[isGeneratedHelper]) {
              // If this is inside a return statement that we have not already handled,
              // we replace the `return ...` with
              // `return (_synchronousReturnValue = ..., _functionState === 'async' ? _synchronousReturnValue : null)`.
              path.replaceWith(Object.assign(
                returnValueWrapperTemplate({
                  SYNC_RETURN_VALUE_IDENTIFIER: identifierGroup.synchronousReturnValue,
                  FUNCTION_STATE_IDENTIFIER: identifierGroup.functionState,
                  NODE: path.node
                }),
                { [isGeneratedHelper]: true }
              ));
              return;
            }
          } else {
            // This is a regular async function. We also transformed these above.
            identifierGroup = path.getFunctionParent().getData(identifierGroupKey);
          }

          // If there is a [isGeneratedHelper] between the function we're in
          // and this node, that means we've already handled this node.
          if (path.find(
            path => path.isFunction() || !!path.node[isGeneratedHelper]
          ).node[isGeneratedHelper]) {
            return;
          }

          // Do not transform foo.bar() into (expr = foo.bar, ... ? await expr : expr)(),
          // because that would mean that the `this` value inside the function is
          // incorrect. This would be hard to get right, but it should be okay for now
          // as we don't currently have to deal with situations in which functions
          // themselves are something that we need to `await`.
          // If we ever do, replacing all function calls with
          // Function.prototype.call.call(fn, target, ...originalArgs) might be
          // a feasible solution.
          // Additionally, skip calls to 'eval', since literal calls to it
          // have semantics that are different from calls to an expressio that
          // evaluates to 'eval'.
          if (path.parentPath.isCallExpression() &&
              path.key === 'callee' &&
              (path.isMemberExpression() || (path.isIdentifier() && path.node.name === 'eval'))) {
            return;
          }

          // This, on the other hand, (e.g. the `foo.bar` in `foo.bar = 1`) is
          // something that we wouldn't want to modify anyway, because it would
          // break the assignment altogether.
          if (path.parentPath.isAssignmentExpression() && path.key === 'left') return;
          // Assignments can happen in weird places, including in situations like
          // `for (obj.prop of [1,2,3]);`.
          if (path.parentPath.isForXStatement() && path.key === 'left') return;
          // ++ and -- count as assignments for our purposes.
          if (path.parentPath.isUpdateExpression()) return;

          // There are a few types of expressions that we can skip.
          // We use this opt-out-list approach so that we don't miss any important
          // expressions.
          if (path.isLiteral() || // type is known to be non-Promise (here and below)
              path.isArrayExpression() ||
              path.isObjectExpression() ||
              path.isFunctionExpression() ||
              path.isArrowFunctionExpression() ||
              path.isClassExpression() ||
              path.isAssignmentExpression() || // sub-nodes are already awaited (ditto)
              path.isBinaryExpression() ||
              path.isConditionalExpression() ||
              path.isLogicalExpression() ||
              path.isSequenceExpression() ||
              path.isParenthesizedExpression() ||
              path.isUnaryExpression() ||
              path.isSuper() || // Would probably break stuff
              path.isThisExpression() ||
              path.isAwaitExpression() || // No point in awaiting twice
              path.parentPath.isAwaitExpression()) {
            return;
          }

          // If it's an identifier and we know where it has been declared, it's fine as well
          // because having seen a declaration means either being undefined or having seen
          // an assignment as well.
          if (path.isIdentifier() && path.scope.hasBinding(path.node.name)) return;

          const { expressionHolder, isSyntheticPromise, assertNotSyntheticPromise } = identifierGroup;
          const prettyOriginalString = limitStringLength(
            path.node.start !== undefined ?
              (this.file as any).code.slice(path.node.start, path.node.end) :
              '<unknown>', 24);

          if (!path.getFunctionParent().node.async) {
            // Transform expression `foo` into `assertNotSyntheticPromise(foo, 'foo')`.
            path.replaceWith(Object.assign(
              assertNotSyntheticExpressionTemplate({
                ORIGINAL_SOURCE: t.stringLiteral(prettyOriginalString),
                NODE: path.node,
                ANSP_IDENTIFIER: assertNotSyntheticPromise
              }),
              { [isGeneratedHelper]: true }
            ));
            return;
          }

          // Transform expression `foo` into
          // `('\uFEFFfoo\uFEFF', ex = foo, isSyntheticPromise(ex) ? await ex : ex)`
          // The first part of the sequence expression is used to identify this
          // expression for re-writing error messages, so that we can transform
          // TypeError: ((intermediate value)(intermediate value) , (intermediate value)(intermediate value)(intermediate value)).findx is not a function
          // back into
          // TypeError: db.test.findx is not a function
          // The U+FEFF markers are only used to rule out any practical chance of
          // user code accidentally being recognized as the original source code.
          // We limit the string length so that long expressions (e.g. those
          // containing functions) are not included in full length.
          const originalSource = t.stringLiteral(
            '\ufeff' + prettyOriginalString + '\ufeff');
          path.replaceWith(Object.assign(
            awaitSyntheticPromiseTemplate({
              ORIGINAL_SOURCE: originalSource,
              EXPRESSION_HOLDER: expressionHolder,
              ISP_IDENTIFIER: isSyntheticPromise,
              NODE: path.node
            }),
            { [isGeneratedHelper]: true }
          ));
        }
      },
      CatchClause: {
        exit(path) {
          if (path.node[isGeneratedHelper] || !path.node.param || path.node.param.type !== 'Identifier') return;
          const existingIdentifiers: AsyncFunctionIdentifiers | null =
            path.findParent(path => !!path.getData(identifierGroupKey))?.getData(identifierGroupKey);
          if (!existingIdentifiers) return;
          // Turn `... catch (err) { ... }` into `... catch (err) { err = demangleError(err); ... }`
          path.replaceWith(Object.assign(
            t.catchClause(path.node.param,
              t.blockStatement([
                t.expressionStatement(
                  t.assignmentExpression('=', path.node.param,
                    t.callExpression(existingIdentifiers.demangleError, [path.node.param]))),
                path.node.body
              ])),
            { [isGeneratedHelper]: true }
          ));
        }
      }
    }
  };
};

function limitStringLength(input: string, maxLength: number) {
  if (input.length <= maxLength) return input;
  return input.slice(0, (maxLength - 5) * 0.7) +
    ' ... ' +
    input.slice(input.length - (maxLength - 5) * 0.3);
}
