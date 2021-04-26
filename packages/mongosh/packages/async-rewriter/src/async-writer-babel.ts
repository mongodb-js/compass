/* eslint no-sync: 0, no-console:0, complexity:0, dot-notation: 0 */
import * as babel from '@babel/core';
import { Visitor } from '@babel/traverse';
import * as BabelTypes from '@babel/types';
import {
  MongoshInternalError,
  MongoshInvalidInputError,
  MongoshUnimplementedError
} from '@mongosh/errors';
import processTopLevelAwait from './await';
import { AsyncRewriterErrors } from './error-codes';
import SymbolTable from './symbol-table';

const debug = (str, type?, indent?): void => {
  indent = indent ? '' : '  ';
  str = `${indent}${str}${type === undefined ? '' : ` ==> ${JSON.stringify(type, (k, v) => (k === 'path' || k === 'returnType' ? undefined : v))}`}`;
  // console.log(str);
};

/**
 * Exported for testing
 */
export function assertUnreachable(type?: never): never {
  throw new MongoshInternalError(`type ${type} unhandled`);
}

export interface Babel {
  types: typeof BabelTypes;
}

export interface MyVisitor {
  visitor: Visitor;
  post?: any;
}

interface State {
  symbols: SymbolTable;
  t: typeof BabelTypes;
  skip: Array<string>;
  returnValues: Array<any>;
}

const getNameOrValue = (t, node): any => {
  if (t.isIdentifier(node)) {
    return node.name;
  } else if (t.isLiteral(node)) {
    return node.value;
  }
  return false;
};

const optionallyWrapNode = (t, path, nodeName): void => {
  if (!t.isBlockStatement(path.node[nodeName])) {
    const replacement = t.isStatement(path.node[nodeName]) ?
      t.blockStatement([path.node[nodeName]]) :
      t.sequenceExpression([path.node[nodeName]]);
    path.get(nodeName).replaceWith(replacement);
  }
};

export const checkHasAsyncChild = (type): boolean => {
  if (type.hasAsyncChild || type.returnsPromise) {
    return true;
  }
  for (let i = 0; i < Object.keys(type).length; i++) {
    if (checkHasAsyncChild(type[Object.keys(type)[i]])) {
      return true;
    }
  }
  return false;
};

/* NOTE: var required so visitor can self-reference.
   Most of the work happens in a sub-visitor so we can pass custom state to traverse.
   Unfortunately babel only exports types for Node() functions, not exit/enter, so need to set by hand. */
var TypeInferenceVisitor: Visitor = { /* eslint no-var:0 */
  Identifier: {
    exit(path: babel.NodePath<babel.types.Identifier>, state: State): void {
      const id = path.node.name;
      let sType = state.symbols.lookup(id);
      if (typeof sType === 'string') {
        sType = state.symbols.signatures[sType];
      }
      path.node['shellType'] = sType;
      debug(`Identifier: { name: ${path.node.name} }`, sType.type);
    }
  },
  MemberExpression: {
    exit(path: babel.NodePath<babel.types.MemberExpression>, state: State): void {
      const lhsType = path.node.object['shellType'];
      const rhsType = path.node.property.type;
      let rhs;
      switch (rhsType) {
        case 'StringLiteral':
          rhs = path.node.property.value;
          break;
        case 'NumericLiteral':
          rhs = path.node.property.value;
          break;
        case 'Identifier':
          rhs = path.node.property.name;
          if (!path.node.computed) {
            break;
          }
        // falls through
        default:
          if (lhsType.hasAsyncChild) {
            const help = lhsType.type === 'Database' ?
              '\nIf you are accessing a collection try Database.get(\'collection\').' :
              '';
            throw new MongoshInvalidInputError(`Cannot access Mongosh API types dynamically. ${help}`, AsyncRewriterErrors.DynamicAccessOfApiType);
          }
          path.node['shellType'] = { type: 'unknown', attributes: {} };
          debug(`MemberExpression: { object.sType: ${lhsType.type}, property.name: ${rhs} }`, path.node['shellType']);
          return;
      }
      if (path.node.object.type === 'ThisExpression') {
        const classPath = path.findParent((p) => p.isClassDeclaration());
        const methodPath = path.findParent((p) => p.isMethod()) as babel.NodePath<babel.types.ClassMethod>;
        // if not within constructor
        if (methodPath.node.kind !== 'constructor' && classPath.node['shellType'].returnType.attributes[rhs] === 'unset') {
          throw new MongoshInvalidInputError(`Unable to use attribute ${rhs} because it's not defined yet`, AsyncRewriterErrors.UsedMemberInClassBeforeDefinition);
        }
      }
      let sType = { type: 'unknown', attributes: {} };
      if (lhsType.attributes === undefined) {
        sType = { type: 'unknown', attributes: {} };
      } else if (rhs in lhsType.attributes) {
        sType = lhsType.attributes[rhs];
      } else if (lhsType.type === 'Database' || lhsType.type === 'Collection') {
        sType = state.symbols.signatures.Collection;
      }
      path.node['shellType'] = sType;
      debug(`MemberExpression: { object.sType: ${lhsType.type}, property.name: ${rhs} }`, sType.type);
    }
  },
  CallExpression: {
    exit(path: babel.NodePath<babel.types.CallExpression>, state: State): void {
      const dbg = `callee.type: ${path.node.callee.type}`;
      let lhsType = path.node.callee['shellType'];

      const isException = path.node.callee.type === 'Identifier' && ['print', 'printjson'].includes(path.node.callee.name);
      // If any of the arguments are a function that returns a promise
      if (!isException && path.node.arguments.some(a => a['shellType'].returnsPromise)) {
        if (path.node.callee.type === 'MemberExpression' &&
            !path.node.callee.computed) {
          switch (path.node.callee.property.type) {
            case 'Identifier':
              // Replace forEach with toIterator(...).forEach
              if (path.node.callee.property.name === 'forEach') {
                if (!path.node.callee.property['replaced']) {
                  const array = path.get('callee').get('object') as babel.NodePath;
                  array.replaceWith(
                    state.t.callExpression(
                      state.t.identifier('toIterator'),
                      [path.node.callee.object]
                    )
                  );
                  path.node.callee.property['replaced'] = true;
                }
                lhsType = { type: 'function', returnsPromise: true, returnType: { type: 'unknown', attributes: {} } };
                break;
              }
            // falls through
            default:
              throw new MongoshInvalidInputError('Cannot pass a function that calls a Mongosh API method as an argument', AsyncRewriterErrors.ApiTypeAsFunctionArgument);
          }
        } else {
          throw new MongoshInvalidInputError('Cannot pass a function that calls a Mongosh API method as an argument', AsyncRewriterErrors.ApiTypeAsFunctionArgument);
        }
      }
      /* Check that the user is not passing a type that has async children to a self-defined function.
         This is possible for scripts but not for line-by-line execution, so turned off for everything. */
      if (!isException && path.node.arguments.some(a => a['shellType'].hasAsyncChild)) {
        throw new MongoshInvalidInputError('Cannot pass a Mongosh API object as an argument to a function', AsyncRewriterErrors.ApiTypeAsFunctionArgument);
      }

      // determine return type
      const returnType = lhsType.returnType;
      let sType = { type: 'unknown', attributes: {} };
      if (lhsType.type === 'function' || lhsType.type === 'classdef') {
        if (typeof returnType === 'string') {
          sType = state.symbols.signatures[returnType];
        } else if (returnType !== undefined) {
          sType = returnType;
        }
        if (lhsType.returnsPromise) {
          // NOTE: if need to convert top-level await into async func can do it here.
          path.node['shellType'] = sType;
          if (path.parent.type !== 'AwaitExpression') {
            path.replaceWith(state.t.awaitExpression(path.node));
          }
          const parent = path.getFunctionParent();
          if (parent !== null) {
            parent.node.async = true;
            parent.node['toAsync'] = true;
          }
          path.skip();
        }
      }
      path.node['shellType'] = sType;

      if ('path' in lhsType && sType.type !== 'classdef') {
        const funcPath = lhsType.path;
        debug(`== visiting function definition for ${lhsType.type}`);
        state.symbols.pushScope(); // manually push/pop scope because body doesn't get visited

        // NOTE: this will allow for passing shell types to non-api functions in scripts, but turned off for now.
        // path.node.arguments.forEach((a, i) => {
        //   const argName = funcPath.node.params[i].name;
        //   state.symbols.add(argName, a['shellType']);
        // });

        path.skip();
        funcPath.get('body').traverse(
          TypeInferenceVisitor,
          { ...state, returnValues: [] }
        );
        state.symbols.popScope();
        debug('== end visiting function definition');
      }
      debug(`CallExpression: { ${dbg}, callee['shellType']: ${lhsType.type} }`, path.node['shellType'].type);
    }
  },
  VariableDeclarator: {
    exit(path: babel.NodePath<babel.types.VariableDeclarator>, state: State): void {
      let sType = { type: 'unknown', attributes: {} };
      if (path.node.init !== null) {
        sType = path.node.init['shellType'];
      }
      path.node['shellType'] = { type: 'unknown', attributes: {} }; // always undefined
      const kind = path.findParent(p => state.t.isVariableDeclaration(p)) as babel.NodePath<babel.types.VariableDeclaration>;
      if (kind === null) {
        assertUnreachable();
      }
      switch (path.node.id.type) {
        case 'Identifier':
          if (kind.node.kind === 'const' || kind.node.kind === 'let') { // block scoped
            state.symbols.add(path.node.id.name, sType);
          } else {
            state.symbols.updateFunctionScoped(path, path.node.id.name, sType, state.t);
          }
          debug(`VariableDeclarator: { id.name: ${path.node.id.name}, init['shellType']: ${
            path.node.init === null ? 'null' : sType.type
          }`, 'unknown'); // id must be a identifier
          break;
        case 'ArrayPattern':
        case 'MemberExpression':
        case 'ObjectPattern':
        case 'AssignmentPattern':
        case 'RestElement':
        case 'TSParameterProperty':
          if (sType['hasAsyncChild'] || sType['returnsPromise']) {
            throw new MongoshUnimplementedError('Destructured assignment is not supported for Mongosh API types.', AsyncRewriterErrors.DestructuringNotImplemented);
          }
          break;
        default:
          assertUnreachable(path.node.id);
      }
    }
  },
  AssignmentExpression: {
    exit(path: babel.NodePath<babel.types.AssignmentExpression>, state: State): void {
      const sType = path.node.right['shellType'] === undefined ? { type: 'unknown', attributes: {} } : path.node.right['shellType'];
      path.node.left['shellType'] = sType;
      path.node['shellType'] = sType; // assignment returns value unlike decl
      switch (path.node.left.type) {
        case 'Identifier':
          if (!state.symbols.updateIfDefined(path.node.left.name, sType)) {
            state.symbols.updateFunctionScoped(path, path.node.left.name, sType, state.t);
          }
          debug(`AssignmentExpression: { left.name: ${path.node.left.name}, right.type: ${path.node.right.type} }`, sType.type); // id must be a identifier
          break;
        case 'MemberExpression':
          let lhsNode = path.node.left;
          const attrs = [];
          while (lhsNode.type === 'MemberExpression') {
            switch (lhsNode.property.type) {
              case 'StringLiteral':
                attrs.unshift(lhsNode.property.value);
                break;
              case 'NumericLiteral':
                attrs.unshift(lhsNode.property.value);
                break;
              case 'Identifier':
                attrs.unshift(lhsNode.property.name);
                if (!lhsNode.computed) {
                  break;
                }
              // falls through
              default:
                if (sType.hasAsyncChild || sType.returnsPromise) {
                  throw new MongoshInvalidInputError('Cannot assign Mongosh API types dynamically', AsyncRewriterErrors.DynamicAccessOfApiType);
                }
            }
            lhsNode = lhsNode.object as babel.types.MemberExpression;
          }
          if (lhsNode.type === 'Identifier') {
            // update symbol table
            const tyTS = lhsNode as unknown;
            const id = tyTS as babel.types.Identifier;
            state.symbols.updateAttribute(id.name, attrs, sType);
          } else if (lhsNode.type === 'ThisExpression') {
            if (attrs.length > 1) {
              throw new MongoshUnimplementedError('Unable to handle nested assignment to \'this\' keyword', AsyncRewriterErrors.NestedThisAssignment);
            }
            const classPath = path.findParent((p) => p.isClassDeclaration());
            if (classPath.node['shellType'].returnType.type === 'unknown') {
              classPath.node['shellType'].returnType.type = 'object';
            }
            classPath.node['shellType'].returnType.attributes[attrs[0]] = sType;
          }
          break;
        case 'RestElement':
        case 'AssignmentPattern':
        case 'ArrayPattern':
        case 'ObjectPattern':
        case 'TSParameterProperty':
          if (sType.hasAsyncChild || sType.returnsPromise) {
            throw new MongoshUnimplementedError('Destructured assignment of Mongosh API types is not supported at this time.', AsyncRewriterErrors.DestructuringNotImplemented);
          }
          break;
        default:
          assertUnreachable(path.node.left);
      }
    }
  },
  ObjectExpression: {
    exit(path: babel.NodePath<babel.types.ObjectExpression>, state: State): void {
      const attributes = {};
      let hasAsyncChild = false;

      const getAttr = (k, value): void => {
        if (k === false) {
          throw new MongoshInternalError('Unexpected AST format.');
        }
        if (value === undefined) {
          value = { type: 'unknown', attributes: {} };
        }
        attributes[k] = value;
        if (attributes[k].hasAsyncChild || attributes[k].returnsPromise) {
          hasAsyncChild = true;
        }
        if (attributes[k].type === 'function') {
          if (attributes[k].returnType.hasAsyncChild || attributes[k].returnType.returnsPromise) {
            hasAsyncChild = true;
          }
        }
      };
      path.node.properties.forEach((n) => {
        switch (n.type) {
          case 'ObjectMethod':
            getAttr(getNameOrValue(state.t, n.key), n['shellType']);
            break;
          case 'ObjectProperty':
            getAttr(getNameOrValue(state.t, n.key), n.value['shellType']);
            break;
          case 'SpreadElement':
            const arg = n.argument['shellType'];
            if (arg) {
              Object.keys(arg.attributes).forEach((k) => {
                getAttr(k, arg.attributes[k]);
              });
            }
            break;
          default:
            assertUnreachable(n);
        }
      });
      path.node['shellType'] = { type: 'object', attributes: attributes, hasAsyncChild: hasAsyncChild };
      debug('ObjectExpression', path.node['shellType']);
    }
  },
  ArrayExpression: {
    exit(path: babel.NodePath<babel.types.ArrayExpression>): void {
      const attributes = {};
      let hasAsyncChild = false;
      path.node.elements.forEach((n, i) => {
        // skip empty items in array (e.g., [1, ,3])
        //                                     ^ empty item
        if (!n) return;
        attributes[i] = n['shellType'];
        if (attributes[i].hasAsyncChild || attributes[i].returnsPromise) {
          hasAsyncChild = true;
        }
        if (attributes[i].type === 'function') {
          if (attributes[i].returnType.hasAsyncChild || attributes[i].returnType.returnsPromise) {
            hasAsyncChild = true;
          }
        }
      });
      path.node['shellType'] = { type: 'array', attributes: attributes, hasAsyncChild };
      debug('ArrayExpression', path.node['shellType']);
    }
  },
  ClassDeclaration: {
    enter(path: babel.NodePath<babel.types.ClassDeclaration> ): void {
      const className = path.node.id === null ? Date.now().toString() : path.node.id.name;
      path.node['shellType'] = {
        type: 'classdef',
        returnType: {
          type: className,
          attributes: {}
        }
      };
      // collect names of methods and set in attributes
      path.node.body.body.forEach((attr) => {
        const fnName = attr.key.name;
        path.node['shellType'].returnType.attributes[fnName] = 'unset';
      });
    },
    exit(path: babel.NodePath<babel.types.ClassDeclaration>, state: State): void {
      const className = path.node.id === null ? Date.now().toString() : path.node.id.name;
      state.symbols.addToParent(className, path.node['shellType']);
      debug(`ClassDeclaration: { name: ${className} }`, path.node['shellType']);
      // collect names of methods and set in attributes
      path.node.body.body.forEach((attr) => {
        const fnName = attr.key.name;
        if (path.node['shellType'].returnType.attributes[fnName] === 'unset') {
          path.node['shellType'].returnType.attributes[fnName] = { type: 'unknown', attributes: {} };
        }
      });
    }
  },
  NewExpression: {
    exit(path: babel.NodePath<babel.types.NewExpression>, state: State): void {
      const dbg = `callee.type: ${path.node.callee.type}`;
      // check that the user is not passing a type that has async children to a self-defined function
      path.node.arguments.forEach((a, index) => {
        if (a['shellType'].hasAsyncChild || a['shellType'].returnsPromise) {
          // TODO: this may need to be a warning
          // TODO: get argument from path.node
          throw new MongoshInvalidInputError(`Argument in position ${index} is now an asynchronous function and may not behave as expected`);
        }
      });

      const lhsType = path.node.callee['shellType'];
      path.node['shellType'] = lhsType.returnType || { type: 'unknown', attributes: {} };
      if (lhsType.returnsPromise) {
        // NOTE: if need to convert top-level await into async func can do it here.
        if (path.parent.type !== 'AwaitExpression') {
          const newNode = state.t.awaitExpression(path.node);
          newNode['shellType'] = lhsType.returnType || { type: 'unknown', attributes: {} };
          path.replaceWith(newNode);
        }
        const parent = path.getFunctionParent();
        if (parent !== null) {
          parent.node.async = true;
          parent.node['toAsync'] = true;
        }
        path.skip();
      }
      debug(`NewExpression: { ${dbg}, callee['shellType']: ${lhsType.type} }`, path.node['shellType'].type);
    }
  },
  ThisExpression: {
    enter(path: babel.NodePath<babel.types.ThisExpression>): void {
      const methodPath = path.findParent((p) => p.isMethod());
      if (!methodPath) {
        throw new MongoshUnimplementedError('Unable to handle \'this\' keyword outside of method definition', AsyncRewriterErrors.UsedThisOutsideOfMethodOfClassDeclaration);
      }
      const classPath = path.findParent((p) => p.isClassDeclaration());
      if (!classPath) {
        throw new MongoshUnimplementedError('Unable to handle \'this\' keyword outside of method definition of class declaration', AsyncRewriterErrors.UsedThisOutsideOfMethodOfClassDeclaration);
      }
      path.node['shellType'] = classPath.node['shellType'].returnType;
    }
  },
  Function: {
    enter(path: babel.NodePath<babel.types.Function>, state: State): void {
      debug('Function Enter');
      const returnTypes = [];
      const symbolCopy1 = state.symbols.deepCopy();
      // NOTE: this is where adding arguments to ST will happen when allowing API args to funcs is turned on.
      path.skip();
      path.node['shellScope'] = symbolCopy1.pushScope();
      path.traverse(TypeInferenceVisitor, {
        t: state.t,
        skip: state.skip,
        returnValues: returnTypes,
        symbols: symbolCopy1
      });
      symbolCopy1.popScope();

      let rType = { type: 'unknown', attributes: {} };
      let dbg;
      if (returnTypes.length === 0) { // no return value, take last or unknown
        if (!state.t.isBlockStatement(path.node.body)) { // => (...);
          dbg = 'single value';
          rType = path.node.body['shellType'];
        } else { // => { ... }
          dbg = 'no return in block statement, undefined';
          rType = { type: 'unknown', attributes: {} };
        }
      } else if (returnTypes.length === 1) {
        dbg = 'single return stmt';
        rType = returnTypes[returnTypes.length - 1];
      } else {
        dbg = 'multi return stmt';
        /* Cannot know if return statements are exhaustive, so turn off returning shell API for everything.
           NOTE: this can be expanded with some effort so returning of the same type is allowed. */
        const someAsync = returnTypes.some((t) => (t.hasAsyncChild || t.returnsPromise));
        if (someAsync) {
          throw new MongoshInvalidInputError('Cannot conditionally return different Mongosh API types.', AsyncRewriterErrors.ConditionalReturn);
        }
        rType = { type: 'unknown', attributes: {} };
      }

      const sType = { type: 'function', returnsPromise: path.node.async && !!path.node['toAsync'], returnType: rType, path: path };
      let debugName = 'lambda';
      if (path.node.type === 'FunctionDeclaration' || path.node.type === 'FunctionExpression') {
        if (path.node.id !== null && !state.t.isAssignmentExpression(path.parent) && !state.t.isVariableDeclarator(path.parent)) {
          state.symbols.updateFunctionScoped(path, path.node.id.name, sType, state.t);
          debugName = path.node.id.name;
        }
      }

      path.node['shellType'] = sType;
      if (path.isClassMethod()) {
        const classPath = path.findParent((p) => p.isClassDeclaration());
        if (!classPath) {
          throw new MongoshUnimplementedError('Unable to handle \'this\' keyword outside of method definition of class declaration');
        }
        if (classPath.node['shellType'].returnType.type === 'unknown') {
          classPath.node['shellType'].returnType.type = 'object';
        }
        // TODO: The 'as any' here is probably not really a valid thing to do.
        classPath.node['shellType'].returnType.attributes[(path.node.key as any).name] = path.node['shellType'];
      }
      debug(`Function: { id: ${debugName} }`, `${sType.type}<${rType.type}> (determined via ${dbg})`);
    }
  },
  ReturnStatement: {
    exit(path: babel.NodePath<babel.types.ReturnStatement>, state: State): void {
      const sType = path.node.argument === null ? { type: 'unknown', attributes: {} } : path.node.argument['shellType'];
      path.node['shellType'] = sType;
      state.returnValues.push(sType);
      debug('ReturnStatement', sType.type);
    }
  },
  Scopable: {
    enter(path: babel.NodePath<babel.types.Scopable>, state: State): void {
      debug(`---new scope at i=${state.symbols.depth}`, path.node.type, true);
      path.node['shellScope'] = state.symbols.pushScope();
    },
    exit(path: babel.NodePath<babel.types.Scopable>, state: State): void {
      state.symbols.popScope();
      debug(`---pop scope at i=${state.symbols.depth}`, path.node.type, true);
    }
  },
  Conditional: {
    enter(path: babel.NodePath<babel.types.Conditional>, state: State): void {
      debug('Conditional');
      path.skip();

      // NOTE: this is a workaround for path.get(...).traverse skipping the root node. Replace child node with block.
      path.get('test').replaceWith(state.t.sequenceExpression([path.node.test]));
      path.get('test').traverse(TypeInferenceVisitor, {
        t: state.t,
        skip: state.skip,
        returnValues: state.returnValues,
        symbols: state.symbols
      });

      const symbolCopyCons = state.symbols.deepCopy();
      const symbolCopyAlt = path.node.alternate !== null ? state.symbols.deepCopy() : null;

      optionallyWrapNode(state.t, path, 'consequent');
      path.node.consequent['shellScope'] = symbolCopyCons.pushScope();
      path.get('consequent').traverse(TypeInferenceVisitor, {
        t: state.t,
        skip: state.skip,
        returnValues: state.returnValues,
        symbols: symbolCopyCons
      });
      symbolCopyCons.popScope();
      if (path.node.alternate === null) {
        return state.symbols.compareSymbolTables( [state.symbols, symbolCopyCons]);
      }

      optionallyWrapNode(state.t, path, 'alternate');
      path.node.alternate['shellScope'] = symbolCopyAlt.pushScope();
      path.get('alternate').traverse(TypeInferenceVisitor, {
        t: state.t,
        skip: state.skip,
        returnValues: state.returnValues,
        symbols: symbolCopyAlt
      });
      symbolCopyAlt.popScope();

      state.symbols.compareSymbolTables([symbolCopyCons, symbolCopyAlt]);

      // set type for ternary
      if (state.t.isConditionalExpression(path.node)) {
        path.node['shellType'] = { type: 'unknown', attributes: {} };
        if (state.t.isSequenceExpression(path.node.consequent) && state.t.isSequenceExpression(path.node.alternate)) {
          const consType = path.node.consequent.expressions[path.node.consequent.expressions.length - 1]['shellType'];
          const altType = path.node.alternate.expressions[path.node.alternate.expressions.length - 1]['shellType'];

          if (state.symbols.compareTypes(consType, altType)) {
            path.node['shellType'] = consType;
          } else {
            const cAsync = consType && (consType.hasAsyncChild || consType.returnsPromise);
            const aAsync = altType && (altType.hasAsyncChild || altType.returnsPromise);
            if (cAsync || aAsync) {
              throw new MongoshInvalidInputError('Cannot conditionally assign different Mongosh API types.', AsyncRewriterErrors.ConditionalAssignment);
            }
            path.node['shellType'] = { type: 'unknown', attributes: {} };
          }
        }
      }
      debug('Conditional', path.node['shellType']);
    }
  },
  Loop: {
    enter(path: babel.NodePath<babel.types.Loop>, state: State): void {
      debug('Loop', path.node.type);

      switch (path.node.type) {
        case 'ForInStatement':
        case 'ForOfStatement':
          // TODO: this can be implemented, but it's tedious. Save for future work?
          throw new MongoshUnimplementedError('\'for in\' and \'for of\' statements are not supported at this time.', AsyncRewriterErrors.ForInForOfUnsupported);
        case 'DoWhileStatement':
        case 'WhileStatement':
        case 'ForStatement':
          path.skip();

          // NOTE: this is a workaround for path.get(...).traverse skipping the root node. Replace child node with block.
          const testPath = path.get('test') as babel.NodePath<babel.types.Node>;
          testPath.replaceWith(state.t.sequenceExpression([path.node.test]));
          testPath.traverse(TypeInferenceVisitor, {
            t: state.t,
            skip: state.skip,
            returnValues: state.returnValues,
            symbols: state.symbols
          });
          const symbolCopyBody = state.symbols.deepCopy();

          optionallyWrapNode(state.t, path, 'body');
          path.node.body['shellScope'] = symbolCopyBody.pushScope();
          path.get('body').traverse(TypeInferenceVisitor, {
            t: state.t,
            skip: state.skip,
            returnValues: state.returnValues,
            symbols: symbolCopyBody
          });
          symbolCopyBody.popScope();
          state.symbols.compareSymbolTables( [state.symbols, symbolCopyBody]);
          state.symbols.popScope(); // required because loops are aliased to scopable, and we call path.skip()
          break;
        default:
          assertUnreachable(path.node);
      }
    }
  },
  SwitchStatement: {
    enter(path: babel.NodePath<babel.types.SwitchStatement>, state: State): void {
      debug('SwitchStatement');
      path.skip();

      path.get('discriminant').replaceWith(state.t.sequenceExpression([path.node.discriminant]));
      path.get('discriminant').traverse(TypeInferenceVisitor, {
        t: state.t,
        skip: state.skip,
        returnValues: state.returnValues,
        symbols: state.symbols
      });

      let exhaustive = false;
      const symbolCopies = path.node.cases.map(() => state.symbols.deepCopy());
      const casesPath = path.get('cases');
      path.node.cases.forEach((_consNode, i) => {
        path.node.cases[i]['shellScope'] = symbolCopies[i].pushScope();
        const casePath = casesPath[i];
        casePath.traverse(TypeInferenceVisitor, {
          t: state.t,
          skip: state.skip,
          returnValues: state.returnValues,
          symbols: symbolCopies[i]
        });
        symbolCopies[i].popScope();

        if (casePath.node.test === null) {
          exhaustive = true;
        }
      });
      // check if the last case is default, if not then not all branches covered by switch
      if (!exhaustive) {
        symbolCopies.unshift(state.symbols);
      }
      state.symbols.compareSymbolTables(symbolCopies);
    }
  },
  exit(path: babel.NodePath, state: State): void {
    const type = path.node['shellType'] || { type: 'unknown', attributes: {} };
    if (state.skip.some((t) => (state.t[t](path.node)))) {
      debug(`${path.node.type}`);
      return;
    }
    path.node['shellType'] = type;
    debug(`*${path.node.type}`, type.type);
  }
};

export default class AsyncWriter {
  public symbols: SymbolTable;
  private plugin: any;

  constructor(signatures: object, st?: SymbolTable) {
    const symbols = st ? st : new SymbolTable([{}], signatures);
    this.symbols = symbols; // public so symbols can be read externally

    this.plugin = ({ types: t }: Babel): MyVisitor => {
      const skip = Object.keys(TypeInferenceVisitor).filter(s => /^[A-Z]/.test(s[0])).map(s => `is${s}`);
      return {
        // post(state): void {
        //   const printAST = require('ast-pretty-print');
        //   console.log('transformed AST:');
        //   console.log(printAST(state.ast));
        // },
        visitor: {
          Program: {
            enter(path): void {
              path.skip();
              path.traverse(TypeInferenceVisitor, {
                t: t,
                skip: skip,
                returnValues: [],
                symbols: symbols
              });
            }
          },
        }
      };
    };
  }

  /**
   * Returns entire AST, separated for testing.
   *
   * @param {string} code - string to compile.
   * @returns {Object} - { ast, code }
   */
  getTransform(code): any {
    try {
      return babel.transformSync(code, {
        plugins: [this.plugin],
        code: true,
        ast: true,
        configFile: false,
        babelrc: false,
        compact: code.length > 10_000
      });
    } catch (e) {
      e.message = e.message.replace('unknown: ', '');
      throw e;
    }
  }

  /**
   * Returns translated code.
   * @param {string} code - string to compile.
   */
  compile(code: string): string {
    return this.getTransform(code).code;
  }

  /**
   * Returns translated code.
   * @param code - string to compile.
   */
  process(code: string): string {
    const input = this.compile(code);
    return processTopLevelAwait(input) || input;
  }
}
