const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/antlr/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/antlr/ECMAScriptParser.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');
const { BsonTranspilersInternalError } = require('./helper/error');

const yaml = require('js-yaml');

const JavascriptVisitor = require('./codegeneration/javascript/Visitor');
const ShellVisitor = require('./codegeneration/shell/Visitor');

const JavaGenerator = require('./codegeneration/java/Generator');
const PythonGenerator = require('./codegeneration/python/Generator');
const CsharpGenerator = require('./codegeneration/csharp/Generator');
const ShellGenerator = require('./codegeneration/shell/Generator');
const JavascriptGenerator = require('./codegeneration/javascript/Generator');

const javascriptjavasymbols = require('./lib/symbol-table/javascripttojava');
const javascriptpythonsymbols = require('./lib/symbol-table/javascripttopython');
const javascriptcsharpsymbols = require('./lib/symbol-table/javascripttocsharp');
const javascriptshellsymbols = require('./lib/symbol-table/javascripttoshell');

const shelljavasymbols = require('./lib/symbol-table/shelltojava');
const shellpythonsymbols = require('./lib/symbol-table/shelltopython');
const shellcsharpsymbols = require('./lib/symbol-table/shelltocsharp');
const shelljavascriptsymbols = require('./lib/symbol-table/shelltojavascript');

/**
 * Constructs the parse tree from the code given by the user.
 *
 * TODO: hardcoded to ECMAScriptLexer/Parser
 * @param {String} input
 * @return {antlr4.ParserRuleContext} - The parse tree.
 */
const loadTree = (input) => {
  // TODO: swap out lexer/parser/etc depending on input lang
  const chars = new antlr4.InputStream(input);
  const lexer = new ECMAScriptLexer.ECMAScriptLexer(chars);
  lexer.strictMode = false;

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new ECMAScriptParser.ECMAScriptParser(tokens);
  parser.buildParseTrees = true;

  const listener = new ErrorListener();
  parser.removeErrorListeners(); // Remove the default ConsoleErrorListener
  parser.addErrorListener(listener); // Add back a custom error listener

  return parser.program();
};

const getTranspiler = (visitor, generator, symbols) => {
  const Transpiler = generator(visitor);
  const transpiler = new Transpiler();

  const doc = yaml.load(symbols);
  Object.assign(transpiler, {
    SYMBOL_TYPE: doc.SymbolTypes,
    BsonTypes: doc.BsonTypes,
    Symbols: Object.assign({}, doc.BsonSymbols, doc.JSSymbols),
    Types: Object.assign({}, doc.BasicTypes, doc.BsonTypes, doc.JSTypes),
    Syntax: doc.Syntax,
    Imports: doc.Imports
  });
  return {
    compile: (input, idiomatic) => {
      try {
        const tree = loadTree(input);
        transpiler.idiomatic = idiomatic === undefined ?
          transpiler.idiomatic :
          idiomatic;
        return transpiler.start(tree);
      } catch (e) {
        if (e.code && e.code.includes('BSONTRANSPILERS')) {
          throw e;
        }
        throw new BsonTranspilersInternalError(e.message, e);
      } finally {
        transpiler.idiomatic = true;
      }
    },
    getImports: () => {
      return transpiler.getImports();
    }
  };
};


module.exports = {
  javascript: {
    java: getTranspiler(JavascriptVisitor, JavaGenerator, javascriptjavasymbols),
    python: getTranspiler(JavascriptVisitor, PythonGenerator, javascriptpythonsymbols),
    csharp: getTranspiler(JavascriptVisitor, CsharpGenerator, javascriptcsharpsymbols),
    shell: getTranspiler(JavascriptVisitor, ShellGenerator, javascriptshellsymbols)
  },
  shell: {
    java: getTranspiler(ShellVisitor, JavaGenerator, shelljavasymbols),
    python: getTranspiler(ShellVisitor, PythonGenerator, shellpythonsymbols),
    csharp: getTranspiler(ShellVisitor, CsharpGenerator, shellcsharpsymbols),
    javascript: getTranspiler(ShellVisitor, JavascriptGenerator, shelljavascriptsymbols)
  },
  getTree: loadTree
};
