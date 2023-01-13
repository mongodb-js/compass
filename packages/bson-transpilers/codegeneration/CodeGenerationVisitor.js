/* eslint complexity: 0, camelcase: 0, "new-cap": 0 */
const {
  BsonTranspilersAttributeError,
  BsonTranspilersArgumentError,
  BsonTranspilersInternalError,
  BsonTranspilersReferenceError,
  BsonTranspilersRuntimeError,
  BsonTranspilersTypeError,
  BsonTranspilersUnimplementedError
} = require('../helper/error');

const { removeQuotes } = require('../helper/format');
const DeclarationStore = require('./DeclarationStore');

/**
 * Class for code generation. Goes in between ANTLR generated visitor and
 * language-specific visitor code. These are basically all helper methods
 * that are used for all input languages.
 *
 * @param {ANTLRVisitor} ANTLRVisitor - An ANTLR-generated visitor class
 * @returns {CodeGenerationVisitor}
 */
module.exports = (ANTLRVisitor) => class CodeGenerationVisitor extends ANTLRVisitor {
  constructor() {
    super();
    this.idiomatic = true; // PUBLIC
    this.clearImports();
    this.state = { declarations: new DeclarationStore() };
  }

  clearImports() {
    this.requiredImports = {};
    [300, 301, 302, 303, 304, 305, 306].forEach(
      (i) => (this.requiredImports[i] = [])
    );
  }

  /**
   * Start the compiler at this.startRule.
   *
   * "Return" methods are overridden only by the object generator. All
   * generators or visitors that translate code to code should not need to
   * override these methods.
   *
   * @param {ParserRuleContext} ctx
   * @return {*}
   */
  returnResult(ctx) {
    const rule = `visit${this.startRule.replace(/^\w/, c => c.toUpperCase())}`;
    if (!this.startRule || !(rule in this)) {
      throw new BsonTranspilersInternalError(
        'Unimplemented Visitor: the entry rule for the compiler must be set'
      );
    }
    return this[rule](ctx);
  }

  returnResultWithDeclarations(ctx) {
    let result = this.returnResult(ctx);
    if (this.getState().declarations.length() > 0) {
      result = `${this.getState().declarations.toString() + '\n\n'}${result}`;
    }
    return result;
  }

  /**
   * PUBLIC: This is the entry point for the compiler. Each visitor must define
   * an attribute called "startNode".
   *
   * @param {ParserRuleContext} ctx
   * @param {Boolean} useDeclarations - prepend the result string with declarations
   * @return {String}
   */
  start(ctx, useDeclarations = false) {
    return (useDeclarations ? this.returnResultWithDeclarations(ctx) : this.returnResult(ctx)).trim();
  }

  getState() {
    return this.state;
  }

  clearDeclarations() {
    this.getState().declarations.clear();
  }

  /**
   * PUBLIC: As code is generated, any classes that require imports are tracked
   * in this.Imports. Each class has a "code" defined in the symbol table.
   * The imports are then generated based on the output language templates.
   * @param {String} mode
   * @param {Boolean} driverSyntax (optional)
   * @return {String} - The list of imports in the target language.
   */
  getImports(mode, driverSyntax) {
    const importTemplate = this.Imports.import.template ?
      this.Imports.import.template :
      (s) => (
        Object.values(s)
          .filter((a, i) => (Object.values(s).indexOf(a) === i))
          .join('\n')
      );
    // Remove empty arrays because js [] is not falsey :(
    [300, 301, 302, 303, 304, 305, 306].forEach(
      (i) => {
        if (i in this.requiredImports && this.requiredImports[i].length === 0) {
          this.requiredImports[i] = false;
        }
      });
    this.requiredImports.driver = !!driverSyntax;
    const imports = {};
    for (const code of Object.keys(this.requiredImports)) {
      if (
        this.requiredImports[code] &&
        this.Imports[code] &&
        this.Imports[code].template
      ) {
        imports[code] = this.Imports[code].template(this.requiredImports[code], mode);
      }
    }
    return importTemplate(imports);
  }

  /**
   * Used by the generators. Makes a copy of the required imports so
   * can be rolled back after a recursion if needed.
   *
   * @return {Object}
   */
  deepCopyRequiredImports() {
    const copy = Object.assign({}, this.requiredImports);
    [300, 301, 302, 303, 304, 305, 306].forEach((i) => {
      copy[i] = Array.from(this.requiredImports[i]);
    });
    return copy;
  }

  /**
   * If the compiler reaches a expression in the input language
   * that is not implemented yet.
   *
   * @param {ParserRuleContext} ctx
   */
  unimplemented(ctx) {
    const name = this.renameNode(ctx.constructor.name);
    throw new BsonTranspilersUnimplementedError(
      `'${name}' not yet implemented`
    );
  }

  /**
   * Some grammar definitions are written so that comparisons will chain and add
   * nodes with a single child when the expression does *not* match. This is a
   * helper method (right now used just by Python) that skips nodes downwards
   * until a node with multiple children is found, or a node matches "goal".
   *
   * @param {ParserRuleContext} ctx
   * @param {String} goal - Optional: the name of the child to find.
   * @return {ParserRuleContext}
   */
  skipFakeNodesDown(ctx, goal) { /* eslint no-unused-vars: 0 */
    return ctx;
  }

  _getType(ctx) {
    if (ctx.type !== undefined) {
      return ctx;
    }
    if (!ctx.children) {
      return null;
    }
    for (const c of ctx.children) {
      const typed = this._getType(c);
      if (typed) {
        return typed;
      }
    }
    return null;
  }

  /**
   * Recursively descend down the tree looking for a node with the type set.
   * Returns the first child node with a type set.
   *
   * @param {ParserRuleContext} ctx
   * @return {ParserRuleContext}
   */
  findTypedNode(ctx) {
    const typed = this._getType(ctx);
    if (!typed) {
      throw new BsonTranspilersInternalError('Type not set on any child nodes');
    }
    return typed;
  }

  /**
   * Get the 'originalType' of ctx, of if it's undefined, keep checking parent
   * nodes until an original type is found. Otherwise null.
   *
   * @param {ParserRuleContext} ctx
   * @return {ParserRuleContext}
   */
  getParentOriginalType(ctx) {
    if (ctx.originalType !== undefined) {
      return ctx.originalType;
    }
    if (ctx.parentCtx) {
      return this.getParentOriginalType(ctx.parentCtx);
    }
    return null;
  }

  compareTypes(expectedType, type, ctx, result) {
    // If the types are exactly the same, just return.
    if (expectedType.indexOf(type) !== -1 ||
      expectedType.indexOf(type.id) !== -1) {
      return result;
    }

    const numericTypes = [
      this.Types._integer, this.Types._decimal, this.Types._hex,
      this.Types._octal, this.Types._long
    ];
    // If both expected and node are numeric literals, cast + return
    for (let i = 0; i < expectedType.length; i++) {
      if (numericTypes.indexOf(type) !== -1 &&
        numericTypes.indexOf(expectedType[i]) !== -1) {
        // Need to visit the octal node always
        if (type.id === '_octal') {
          return this.leafHelper(
            expectedType[i],
            {
              type: expectedType[i],
              originalType: type.id,
              getText: () => ( this.visit(ctx) )
            }
          );
        }
        const child = this.skipFakeNodesDown(ctx);
        child.originalType = type;
        child.type = expectedType[i];
        return this.leafHelper(expectedType[i], child);
      }
    }

    // If the expected type is "numeric", accept the number basic & bson types
    if (expectedType.indexOf(this.Types._numeric) !== -1 &&
      (numericTypes.indexOf(type) !== -1 || (type.code === 106 ||
        type.code === 105 || type.code === 104))) {
      return result;
    }
    // If the expected type is any number, accept float/int/_numeric
    if ((numericTypes.some((t) => ( expectedType.indexOf(t) !== -1))) &&
      (type.code === 106 || type.code === 105 || type.code === 104 ||
        type === this.Types._numeric)) {
      return result;
    }
    return null;
  }

  /**
   * Convert between numeric types. Required so that we don't end up with
   * strange conversions like 'Int32(Double(2))', and can just generate '2'.
   *
   * @param {Array} expectedType - types to cast to.
   * @param {ParserRuleContext} ctx - ctx to cast from, if valid.
   *
   * @returns {String} - visited result, or null on error.
   */
  castType(expectedType, ctx) {
    const result = this.visit(ctx);
    const typedCtx = this.findTypedNode(ctx);
    let type = typedCtx.type;

    let equal = this.compareTypes(expectedType, type, ctx, result);
    while (equal === null) {
      if (type.type === null) {
        return null;
      }
      type = type.type;
      equal = this.compareTypes(expectedType, type, ctx, result);
    }
    return equal;
  }

  /**
   * Validate each argument against the expected argument types defined in the
   * Symbol table.
   *
   * @param {Array} expected - An array of arrays where each subarray represents
   * possible argument types for that index.
   * @param {Array} args - empty if no args.
   * @param {String} name - The name of the function for error reporting.
   * @param {Object} namedArgs - Optional: if named arguments exist, this is the
   * mapping of name to default value.
   *
   * @returns {Array} - Array containing the generated output for each argument.
   */
  checkArguments(expected, args, name, namedArgs) {
    const argStr = [];
    if (args.length === 0) {
      if (expected.length === 0 || expected[0].indexOf(null) !== -1) {
        return argStr;
      }
      throw new BsonTranspilersArgumentError(
        `Argument count mismatch: '${name}' requires least one argument`
      );
    }
    if (args.length > expected.length) {
      throw new BsonTranspilersArgumentError(
        `Argument count mismatch: '${name}' expects ${
          expected.length} args and got ${args.length}`
      );
    }
    for (let i = 0; i < expected.length; i++) {
      if (args[i] === undefined) {
        if (expected[i].indexOf(null) !== -1) {
          return argStr;
        }
        throw new BsonTranspilersArgumentError(
          `Argument count mismatch: too few arguments passed to '${name}'`
        );
      }

      const toCompare = this.checkNamedArgs(expected[i], args[i], namedArgs);
      const result = this.castType(...toCompare);
      if (result === null) {
        const typeStr = expected[i].map((e) => {
          const id = e && e.id ? e.id : e;
          return e ? id : '[optional]';
        }).join(', ');
        const message = `Argument type mismatch: '${name}' expects types ${
          typeStr} but got type ${this.findTypedNode(args[i]).type.id
        } for argument at index ${i}`;

        throw new BsonTranspilersArgumentError(message);
      }
      argStr.push(result);
    }
    return argStr;
  }

  /*
   * Overriden only by the object generator.
   */
  returnFunctionCallLhs(code, name) {
    return name;
  }
  returnFunctionCallLhsRhs(lhs, rhs, lhsType, l) {
    if (lhsType.argsTemplate) {
      rhs = lhsType.argsTemplate.bind(this.getState())(l, ...rhs);
    } else {
      rhs = `(${rhs.join(', ')})`;
    }
    return `${lhs}${rhs}`;
  }

  returnAttributeAccess(lhs, rhs, type) {
    if (type && type.attr[rhs].template) {
      return type.attr[rhs].template(lhs, rhs);
    }
    return `${lhs}.${rhs}`;
  }
  returnParenthesis(expr) {
    return `(${expr})`;
  }
  returnSet(args, ctx) {
    return this.visitChildren(ctx);
  }

  /**
   * Generate a function call, diverting to process or emit methods if they
   * exist.
   * @param {ParserRuleContext} ctx
   * @return {*}
   */
  generateFunctionCall(ctx) {
    const funcNameNode = this.getFunctionCallName(ctx);
    const lhs = this.visit(funcNameNode);
    let l = lhs;
    let lhsType = this.findTypedNode(funcNameNode).type;
    if (typeof lhsType === 'string') {
      lhsType = this.Types[lhsType];
    }

    // Special case
    if (`process${lhsType.id}` in this) {
      return this[`process${lhsType.id}`](ctx);
    }
    if (`emit${lhsType.id}` in this) {
      return this[`emit${lhsType.id}`](ctx);
    }

    // Check if left-hand-side is callable
    ctx.type = lhsType.type;
    if (!lhsType.callable) {
      throw new BsonTranspilersTypeError(`${lhsType.id} is not callable`);
    }

    // Check arguments
    const expectedArgs = lhsType.args;
    const rhs = this.checkArguments(
      expectedArgs, this.getArguments(ctx), lhsType.id, lhsType.namedArgs
    );

    // Apply the arguments template
    if (lhsType.argsTemplate) {
      l = this.visit(this.getIfIdentifier(funcNameNode));
    }
    const expr = this.returnFunctionCallLhsRhs(lhs, rhs, lhsType, l);
    const constructor = lhsType.callable === this.SYMBOL_TYPE.CONSTRUCTOR;

    return this.Syntax.new.template
      ? this.Syntax.new.template(expr, !constructor, lhsType.code)
      : expr;
  }

  /**
   * Visit a symbol and error if undefined. Otherwise check symbol table and
   * replace if template exists.
   *
   * @param {ParserRuleContext} ctx
   * @return {*}
   */
  generateIdentifier(ctx) {
    const name = this.visitChildren(ctx);
    ctx.type = this.Symbols[name];
    if (ctx.type === undefined) {
      throw new BsonTranspilersReferenceError(`Symbol '${name}' is undefined`);
    }
    this.requiredImports[ctx.type.code] = true;

    if (ctx.type.template) {
      return ctx.type.template();
    }
    return this.returnFunctionCallLhs(ctx.type.code, name);
  }

  /**
   * Generate attribute access. Visitors are in charge of making sure that
   * if lhs type attribute access is not supported, an error is thrown.
   *
   * NOTE: If the attribute isn't defined on the lhsType, then it will check the
   * lhsType.type to see if defined. It will loop, checking the lhs type's type,
   * until the attribute exists or the .type is null. If the type is null,
   * and the class is a BSON class, then error. If it is a native type however,
   * do not error and just return the original attribute. This is to not annoy
   * people with attribute errors in languages where it wouldn't throw anyway.
   * It feels better to be strict about BSON than the whole language, but it's
   * up for debate. TODO: could set type checking to 'strict' or 'non-strict' in
   * the visitor, and then only error if we are compiling from a strictly typed
   * language.
   *
   * @param {ParserRuleContext} ctx
   * @return {*}
   */
  generateAttributeAccess(ctx) {
    if ('emitAttributeAccess' in this) {
      return this.emitAttributeAccess(ctx);
    }
    const lhsNode = this.getAttributeLHS(ctx);
    const lhs = this.visit(lhsNode);
    const rhs = this.getAttributeRHS(ctx).getText();

    let type = this.findTypedNode(lhsNode).type;
    if (typeof type === 'string') {
      type = this.Types[type];
    }
    while (type !== null) {
      if (!(type.attr.hasOwnProperty(rhs))) {
        if (type.id in this.BsonTypes && this.BsonTypes[type.id].id !== null) { // TODO: tell symbols vs types
          throw new BsonTranspilersAttributeError(
            `'${rhs}' not an attribute of ${type.id}`
          );
        }
        type = type.type;
        if (typeof type === 'string') {
          type = this.Types[type];
        }
      } else {
        break;
      }
    }
    if (type === null) {
      ctx.type = this.Types._undefined;
      // TODO: how strict do we want to be?
      return this.returnAttributeAccess(lhs, rhs, type);
    }
    ctx.type = type.attr[rhs];
    return this.returnAttributeAccess(lhs, rhs, type);
  }

  /**
   * This helper function checks for an emit method then applies the templates
   * if they exist for a function call node. Used primarily by process methods.
   *
   * @param {ParserRuleContext} ctx - The function call node
   * @param {Object} lhsType - The type
   * @param {Array} args - Arguments to the template
   * @param {String} defaultT - The default name if no template exists.
   * @param {String} defaultA - The default arguments if no argsTemplate exists.
   * @param {Boolean} skipNew - Optional: If true, never add new.
   * @param {Boolean} skipLhs - Optional: If true, don't add lhs to result.
   *
   * @return {*}
   */
  generateCall(ctx, lhsType, args, defaultT, defaultA, skipNew, skipLhs) {
    if (`emit${lhsType.id}` in this) {
      return this[`emit${lhsType.id}`](ctx);
    }
    const lhsArg = lhsType.template
      ? lhsType.template()
      : defaultT;
    const rhs = lhsType.argsTemplate
      ? lhsType.argsTemplate.bind(this.getState())(lhsArg, ...args)
      : defaultA;
    const lhs = skipLhs ? '' : lhsArg;
    return this.Syntax.new.template
      ? this.Syntax.new.template(`${lhs}${rhs}`, skipNew, lhsType.code)
      : `${lhs}${rhs}`;
  }

  generateObjectLiteral(ctx) {
    if (this.idiomatic && 'emitIdiomaticObjectLiteral' in this) {
      return this.emitIdiomaticObjectLiteral(ctx);
    }
    const type = this.Types._object;
    if (`emit${type.id}` in this) {
      return this[`emit${type.id}`](ctx);
    }
    ctx.type = type;
    this.requiredImports[10] = true;
    ctx.indentDepth = this.findIndentDepth(ctx) + 1;
    let args = '';
    const keysAndValues = this.getKeyValueList(ctx);
    if (ctx.type.argsTemplate) {
      args = ctx.type.argsTemplate.bind(this.getState())(
        this.getKeyValueList(ctx).map((k) => {
          return [this.getKeyStr(k), this.visit(this.getValue(k))];
        }),
        ctx.indentDepth);
    } else {
      args = this.visit(keysAndValues);
    }
    ctx.indentDepth--;
    if (ctx.type.template) {
      return ctx.type.template.bind(this.getState())(args, ctx.indentDepth);
    }
    return this.visitChildren(ctx);
  }

  generateArrayLiteral(ctx) {
    const type = this.Types._array;
    if (`emit${type.id}` in this) {
      return this[`emit${type.id}`](ctx);
    }
    ctx.type = type;
    ctx.indentDepth = this.findIndentDepth(ctx) + 1;
    this.requiredImports[9] = true;
    let args = '';
    const list = this.getList(ctx);
    const visitedElements = list.map((child) => ( this.visit(child) ));
    if (ctx.type.argsTemplate) { // NOTE: not currently being used anywhere.
      args = visitedElements.map((arg, index) => {
        const last = !visitedElements[index + 1];
        return ctx.type.argsTemplate.bind(this.getState())(arg, ctx.indentDepth, last);
      }).join('');
    } else {
      args = visitedElements.join(', ');
    }
    if (ctx.type.template) {
      return ctx.type.template(args, ctx.indentDepth);
    }
    return this.visitChildren(ctx);
  }

  /**
   * Called from the process methods of numeric class constructors.
   * We know there will be a single (sometimes optional) argument that is
   * a number or string.
   *
   * Required because we want to pass the argument type to the template
   * so that we can determine if the generated number needs to be parsed or
   * casted.
   *
   * @param {ParserRuleContext} ctx
   * @returns {String}
   */
  generateNumericClass(ctx) {
    const funcNameNode = this.getFunctionCallName(ctx);
    const lhsStr = this.visit(funcNameNode);
    let lhsType = this.findTypedNode(funcNameNode).type;
    if (typeof lhsType === 'string') {
      lhsType = this.Types[lhsType];
    }
    ctx.type = lhsType.type;
    if (`emit${lhsType.id}` in this) {
      this[`emit${lhsType.id}`](ctx);
    }

    // Get the original type of the argument
    const expectedArgs = lhsType.args;
    let args = this.checkArguments(
      expectedArgs, this.getArguments(ctx), lhsType.id, lhsType.namedArgs
    );
    let argType;

    if (args.length === 0) {
      args = ['0'];
      argType = this.Types._integer;
    } else {
      const argNode = this.getArgumentAt(ctx, 0);
      const typed = this.findTypedNode(argNode);
      argType = typed.originalType !== undefined ?
        typed.originalType :
        typed.type;
    }

    return this.generateCall(
      ctx, lhsType, [args[0], argType.id], lhsStr, `(${args.join(', ')})`
    );
  }

  /**
   * Same as generateCall but for type literals instead of function calls.
   *
   * @param {ParserRuleContext} ctx - The literal node
   * @param {Object} lhsType - The type
   * @param {Array} args - Arguments to the template
   * @param {String} defaultT - The default if no template exists.
   * @param {Boolean} skipNew - Optional: If true, never add new.
   *
   * @return {*}
   */
  generateLiteral(ctx, lhsType, args, defaultT, skipNew) {
    if (`emit${lhsType.id}` in this) {
      return this[`emit${lhsType.id}`](ctx);
    }
    if (lhsType.template) {
      const str = lhsType.template(...args);
      return this.Syntax.new.template
        ? this.Syntax.new.template(str, skipNew, lhsType.code)
        : str;
    }
    return defaultT;
  }

  /**
   * Helper method for generating literals. Called from the visit methods for
   * literal nodes.
   *
   * @param {Object} setType - the type to set the literal to.
   * @param {ParserRuleContext} ctx - the tree node.
   * @return {*}
   */
  leafHelper(setType, ctx) {
    ctx.type = setType;
    this.requiredImports[ctx.type.code] = true;

    // Pass the original argument type to the template, not the casted type.
    const parentOriginalType = this.getParentOriginalType(ctx);
    const type = parentOriginalType === null ? ctx.type : parentOriginalType;

    if (`process${ctx.type.id}` in this) {
      return this[`process${ctx.type.id}`](ctx);
    }
    if (`emit${ctx.type.id}` in this) {
      return this[`emit${ctx.type.id}`](ctx);
    }
    const children = ctx.getText();
    return this.generateLiteral(ctx, ctx.type, [children, type.id], children, true);
  }

  findIndentDepth(ctx) {
    while (ctx.indentDepth === undefined) {
      ctx = ctx.parentCtx;
      if (ctx === undefined || ctx === null) {
        return -1;
      }
    }
    return ctx.indentDepth;
  }

  /**
   * Process required for BSON regex types so we can validate the flags.
   *
   * @param {ParserRuleContext} ctx
   * @param {Object} type - The type of the LHS
   * @param {Object} symbolType - The type of the Symbol
   * @return {*}
   */
  generateBSONRegex(ctx, type, symbolType) {
    if (`emit${type.id}` in this) {
      return this[`emit${type.id}`](ctx);
    }
    ctx.type = type;

    const args = this.checkArguments(
      symbolType.args, this.getArguments(ctx), type.id, symbolType.namedArgs
    );

    const expectedFlags = this.Syntax.bsonRegexFlags
      ? this.Syntax.bsonRegexFlags
      : { i: 'i', m: 'm', x: 'x', s: 's', l: 'l', u: 'u' };

    let flags = null;
    const pattern = args[0];
    if (args.length === 2) {
      flags = args[1];
      for (let i = 1; i < flags.length - 1; i++) {
        if (!(flags[i] in expectedFlags)) {
          throw new BsonTranspilersRuntimeError(
            `Invalid flag '${flags[i]}' passed to Regexp`
          );
        }
      }
      flags = flags.replace(/[imxlsu]/g, m => expectedFlags[m]);
    }

    return this.generateCall(
      ctx, symbolType, [pattern, flags], 'Regex',
      `(${pattern}${flags ? ', ' + flags : ''})`
    );
  }

  /**
   * Code is processed in every language because want to generate the scope as
   * a non-idiomatic document.
   *
   * @param {ParserRuleContext} ctx
   * @param {Object} type - The type of the LHS
   * @param {Object} symbolType - The type of the Symbol
   * @param {boolean} requireString - if the code argument must be a string.
   * @return {*}
   */
  generateBSONCode(ctx, type, symbolType, requireString) {
    if (`emit${type.id}` in this) {
      return this[`emit${type.id}`](ctx);
    }
    ctx.type = type;
    const argList = this.getArguments(ctx);
    if (!(argList.length === 1 || argList.length === 2)) {
      throw new BsonTranspilersArgumentError(
        'Argument count mismatch: Code requires one or two arguments'
      );
    }
    let code = '';
    if (requireString) {
      const arg = this.getArgumentAt(ctx, 0);
      code = this.visit(arg);
      if (this.findTypedNode(arg).type !== this.Types._string) {
        throw new BsonTranspilersArgumentError(
          'Argument type mismatch: Code requires first argument to be a string'
        );
      }
    } else {
      code = removeQuotes(this.getArgumentAt(ctx, 0).getText());
    }
    let scope = undefined;
    let scopestr = '';

    if (argList.length === 2) {
      const idiomatic = this.idiomatic;
      this.idiomatic = false;
      const compareTo = this.checkNamedArgs(
        [this.Types._object], this.getArgumentAt(ctx, 1), symbolType.namedArgs
      );
      scope = this.castType(...compareTo);
      if (scope === null) {
        throw new BsonTranspilersArgumentError(
          'Code expects argument \'scope\' to be object'
        );
      }
      this.idiomatic = idiomatic;
      scopestr = `, ${scope}`;
      this.requiredImports[113] = true;
      this.requiredImports[10] = true;
    }
    return this.generateCall(
      ctx, symbolType, [code, scope], 'Code', `(${code}${scopestr})`
    );
  }

  /**
   * Gets a process method because need to tell the template if
   * the argument is a number or a date.
   *
   * @param {ParserRuleContext} ctx
   * @returns {String} - generated code
   */
  generateObjectIdFromTime(ctx) {
    const funcNameNode = this.getFunctionCallName(ctx);
    const lhsStr = this.visit(funcNameNode);
    let lhsType = this.findTypedNode(funcNameNode).type;
    if (typeof lhsType === 'string') {
      lhsType = this.Types[lhsType];
    }

    const args = this.checkArguments(
      lhsType.args, this.getArguments(ctx), lhsType.id, lhsType.namedArgs
    );
    const isNumber = this.findTypedNode(
      this.getArgumentAt(ctx, 0)).type.code !== 200;
    return this.generateCall(
      ctx, lhsType, [args[0], isNumber], lhsStr, `(${args.join(', ')})`, true
    );
  }

  generateFuncDefExpression() {
    throw new BsonTranspilersUnimplementedError(
      'Support for exporting functions to languages other than javascript is not yet available.'
    );
  }

  /**
   * Overrides the ANTLR visitChildren method so that options can be set.
   *
   * @param {ParserRuleContext} ctx
   * @param {Object} options:
   *    start - child index to start iterating at.
   *    end - child index to end iterating after.
   *    step - how many children to increment each step, 1 visits all children.
   *    separator - a string separator to go between generated children.
   *    ignore - an array of child indexes to skip.
   *    children - the set of children to visit.
   * @returns {String}
   */
  visitChildren(ctx, options) {
    const opts = {
      start: 0, step: 1, separator: '', ignore: [], children: ctx.children
    };
    Object.assign(opts, options ? options : {});
    opts.end = ('end' in opts) ? opts.end : opts.children.length - 1;

    let code = '';
    for (let i = opts.start; i <= opts.end; i += opts.step) {
      if (opts.ignore.indexOf(i) === -1) {
        code = `${code}${this.visit(
          opts.children[i]
        )}${(i === opts.end) ? '' : opts.separator}`;
      }
    }
    return code;
  }

  /**
   * Visit a end-of-file symbol. Universal for all grammars.
   * *
   * @returns {String}
   */
  visitEof() {
    if (this.Syntax.eof.template) {
      return this.Syntax.eof.template();
    }
    return '';
  }

  /**
   * Visit a end-of-line symbol. Universal for all grammars.
   * *
   * @returns {String}
   */
  visitEos() {
    if (this.Syntax.eos.template) {
      return this.Syntax.eos.template();
    }
    return '\n';
  }

  /**
   * Visit a leaf node and return a string. Universal for all grammars.
   * *
   * @param {ParserRuleContext} ctx
   * @returns {String}
   */
  visitTerminal(ctx) {
    return ctx.getText();
  }
};
