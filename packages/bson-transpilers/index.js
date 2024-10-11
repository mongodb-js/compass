'use strict';
const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/antlr/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/antlr/ECMAScriptParser.js');

const JavascriptANTLRVisitor =
  require('./lib/antlr/ECMAScriptVisitor').ECMAScriptVisitor;

const ErrorListener = require('./codegeneration/ErrorListener.js');
const {
  BsonTranspilersInternalError,
  BsonTranspilersUnimplementedError,
} = require('./helper/error');

const yaml = require('js-yaml');

const getCodeGenerationVisitor = require('./codegeneration/CodeGenerationVisitor');
const getJavascriptVisitor = require('./codegeneration/javascript/Visitor');
const getShellVisitor = require('./codegeneration/shell/Visitor');
const getJavaGenerator = require('./codegeneration/java/Generator');
const getPythonGenerator = require('./codegeneration/python/Generator');
const getCsharpGenerator = require('./codegeneration/csharp/Generator');
const getJavascriptGenerator = require('./codegeneration/javascript/Generator');
const getObjectGenerator = require('./codegeneration/object/Generator');
const getRubyGenerator = require('./codegeneration/ruby/Generator.js');
const getGoGenerator = require('./codegeneration/go/Generator.js');
const getRustGenerator = require('./codegeneration/rust/Generator.js');
const getPhpGenerator = require('./codegeneration/php/Generator.js');

const shelljavasymbols = require('./lib/symbol-table/shelltojava');
const shellpythonsymbols = require('./lib/symbol-table/shelltopython');
const shellcsharpsymbols = require('./lib/symbol-table/shelltocsharp');
const shelljavascriptsymbols = require('./lib/symbol-table/shelltojavascript');
const shellobjectsymbols = require('./lib/symbol-table/shelltoobject');
const shellrubysymbols = require('./lib/symbol-table/shelltoruby');
const shellgosymbols = require('./lib/symbol-table/shelltogo');
const shellrustsymbols = require('./lib/symbol-table/shelltorust');
const shellphpsymbols = require('./lib/symbol-table/shelltophp');

/**
 * Constructs the parse tree from the JS or Shell code given by the user.
 *
 * @param {String} input - the input code.
 * @param {String} start - the name of the start node. Always defined in the
 * language-specific visitor.
 * @return {antlr4.ParserRuleContext} - The parse tree.
 */
const loadJSTree = (input, start) => {
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  lexer.strictMode = false;

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;

  const listener = new ErrorListener();
  parser.removeErrorListeners(); // Remove the default ConsoleErrorListener
  parser.addErrorListener(listener); // Add back a custom error listener

  return parser[start]();
};

const getTranspiler = (loadTree, visitor, generator, symbols) => {
  const Transpiler = generator(visitor);
  const transpiler = new Transpiler();

  const doc = yaml.load(symbols);

  /* Object validation. If the symbol table is missing any of these elements,
   * then an error should be thrown. Can be empty, but must exist. */
  [
    'BasicTypes',
    'BsonTypes',
    'NativeTypes',
    'SymbolTypes',
    'BsonTypes',
    'BsonSymbols',
    'NativeSymbols',
    'SymbolTypes',
  ].map((k) => {
    if (!(k in doc)) {
      throw new BsonTranspilersInternalError(
        `Invalid Symbol Table: missing ${k}`
      );
    }
  });
  Object.assign(transpiler, {
    SYMBOL_TYPE: doc.SymbolTypes,
    BsonTypes: doc.BsonTypes,
    Symbols: Object.assign({}, doc.BsonSymbols, doc.NativeSymbols),
    Types: Object.assign({}, doc.BasicTypes, doc.BsonTypes, doc.NativeTypes),
    Syntax: doc.Syntax,
    Imports: doc.Imports,
  });

  const compile = (input, idiomatic, driverSyntax) => {
    try {
      const tree = loadTree(input, transpiler.startRule);
      transpiler.idiomatic =
        idiomatic === undefined ? transpiler.idiomatic : idiomatic;
      if (!driverSyntax) {
        transpiler.clearImports();
        transpiler.clearDeclarations();
      }
      return transpiler.start(tree, !driverSyntax);
    } catch (e) {
      if (e.code && e.code.includes('BSONTRANSPILERS')) {
        throw e;
      }
      throw new BsonTranspilersInternalError(e.message, e);
    } finally {
      transpiler.idiomatic = true;
    }
  };

  return {
    compileWithDriver: (input, idiomatic) => {
      transpiler.clearImports();
      transpiler.clearDeclarations();

      const result = {};
      Object.keys(input).map((k) => {
        result[k] =
          k === 'options' || k === 'exportMode'
            ? input[k]
            : compile(input[k], idiomatic, true);
      });
      if (
        !('options' in result) ||
        !('uri' in result.options) ||
        !('database' in result.options) ||
        !('collection' in result.options)
      ) {
        throw new BsonTranspilersInternalError(
          'Missing required metadata to generate drivers syntax'
        );
      }
      if (!('aggregation' in result) && !('filter' in result)) {
        throw new BsonTranspilersInternalError(
          "Need to pass 'aggregation' or 'filter' when compiling with driver syntax"
        );
      }
      if (!transpiler.Syntax.driver) {
        throw new BsonTranspilersUnimplementedError(
          'Generating driver syntax not implemented for current language'
        );
      }
      return transpiler.Syntax.driver.bind(transpiler.getState())(result);
    },
    compile: compile,
    getImports: (mode, driverSyntax) => {
      return transpiler.getImports(mode, driverSyntax);
    },
  };
};

module.exports = {
  shell: {
    java: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getJavaGenerator,
      shelljavasymbols
    ),
    python: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getPythonGenerator,
      shellpythonsymbols
    ),
    csharp: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getCsharpGenerator,
      shellcsharpsymbols
    ),
    javascript: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getJavascriptGenerator,
      shelljavascriptsymbols
    ),
    object: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getObjectGenerator,
      shellobjectsymbols
    ),
    ruby: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getRubyGenerator,
      shellrubysymbols
    ),
    go: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getGoGenerator,
      shellgosymbols
    ),
    rust: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getRustGenerator,
      shellrustsymbols
    ),
    php: getTranspiler(
      loadJSTree,
      getShellVisitor(
        getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))
      ),
      getPhpGenerator,
      shellphpsymbols
    ),
  },
  getTree: {
    shell: loadJSTree,
  },
};
