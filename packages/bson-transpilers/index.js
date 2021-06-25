const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/antlr/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/antlr/ECMAScriptParser.js');
const Python3Lexer = require('./lib/antlr/Python3Lexer.js');
const Python3Parser = require('./lib/antlr/Python3Parser');

const JavascriptANTLRVisitor = require('./lib/antlr/ECMAScriptVisitor').ECMAScriptVisitor;
const PythonANTLRVisitor = require('./lib/antlr/Python3Visitor').Python3Visitor;

const ErrorListener = require('./codegeneration/ErrorListener.js');
const { BsonTranspilersInternalError } = require('./helper/error');

const yaml = require('js-yaml');

const getCodeGenerationVisitor = require('./codegeneration/CodeGenerationVisitor');
const getJavascriptVisitor = require('./codegeneration/javascript/Visitor');
const getShellVisitor = require('./codegeneration/shell/Visitor');
const getPythonVisitor = require('./codegeneration/python/Visitor');

const getJavaGenerator = require('./codegeneration/java/Generator');
const getPythonGenerator = require('./codegeneration/python/Generator');
const getCsharpGenerator = require('./codegeneration/csharp/Generator');
const getShellGenerator = require('./codegeneration/shell/Generator');
const getJavascriptGenerator = require('./codegeneration/javascript/Generator');
const getObjectGenerator = require('./codegeneration/object/Generator');

const javascriptjavasymbols = require('./lib/symbol-table/javascripttojava');
const javascriptpythonsymbols = require('./lib/symbol-table/javascripttopython');
const javascriptcsharpsymbols = require('./lib/symbol-table/javascripttocsharp');
const javascriptshellsymbols = require('./lib/symbol-table/javascripttoshell');
const javascriptobjectsymbols = require('./lib/symbol-table/javascripttoobject');

const shelljavasymbols = require('./lib/symbol-table/shelltojava');
const shellpythonsymbols = require('./lib/symbol-table/shelltopython');
const shellcsharpsymbols = require('./lib/symbol-table/shelltocsharp');
const shelljavascriptsymbols = require('./lib/symbol-table/shelltojavascript');
const shellobjectsymbols = require('./lib/symbol-table/shelltoobject');

const pythonjavasymbols = require('./lib/symbol-table/pythontojava');
const pythonshellsymbols = require('./lib/symbol-table/pythontoshell');
const pythoncsharpsymbols = require('./lib/symbol-table/pythontocsharp');
const pythonjavascriptsymbols = require('./lib/symbol-table/pythontojavascript');
const pythonobjectsymbols = require('./lib/symbol-table/pythontoobject');

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

/**
 * Constructs the parse tree from the Python code given by the user.
 *
 * @param {String} input
 * @param {String} start - the name of the start node. Always defined in the
 * language-specific visitor.
 * @return {antlr4.ParserRuleContext} - The parse tree.
 */
const loadPyTree = (input, start) => {
  const chars = new antlr4.InputStream(input + '\n'); // requires newline
  const lexer = new Python3Lexer.Python3Lexer(chars);

  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new Python3Parser.Python3Parser(tokens);
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
  ['BasicTypes', 'BsonTypes', 'NativeTypes', 'SymbolTypes', 'BsonTypes',
    'BsonSymbols', 'NativeSymbols', 'SymbolTypes'].map((k) => {
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
    Imports: doc.Imports
  });

  const compile = (input, idiomatic, driverSyntax) => {
    try {
      const tree = loadTree(input, transpiler.startRule);
      transpiler.idiomatic = idiomatic === undefined ?
        transpiler.idiomatic :
        idiomatic;
      transpiler.useDriverSyntax(
        driverSyntax === undefined ? transpiler.driverSyntax : driverSyntax
      );
      return transpiler.start(tree);
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
      Object.keys(input).map((k) => {
        input[k] = k === 'options' ? input[k] : compile(input[k], idiomatic, true);
      });
      if (!('options' in input)) {
        throw new BsonTranspilersInternalError(
          'Missing required metadata to generate drivers syntax'
        );
      }
      if (!('aggregation' in input) && !('filter' in input)) {
        throw new BsonTranspilersInternalError(
          'Malformed argument to compileWithDriver, needs to include either \'aggregation\' or \'filter\''
        );
      }
      return transpiler.Syntax.driver(input);
    },
    compile: compile,
    getImports: () => {
      return transpiler.getImports();
    }
  };
};

module.exports = {
  javascript: {
    java: getTranspiler(
      loadJSTree,
      getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor)),
      getJavaGenerator,
      javascriptjavasymbols
    ),
    python: getTranspiler(
      loadJSTree,
      getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor)),
      getPythonGenerator,
      javascriptpythonsymbols
    ),
    csharp: getTranspiler(
      loadJSTree,
      getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor)),
      getCsharpGenerator,
      javascriptcsharpsymbols
    ),
    shell: getTranspiler(
      loadJSTree,
      getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor)),
      getShellGenerator,
      javascriptshellsymbols
    ),
    object: getTranspiler(
      loadJSTree,
      getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor)),
      getObjectGenerator,
      javascriptobjectsymbols
    )
  },
  shell: {
    java: getTranspiler(
      loadJSTree,
      getShellVisitor(getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))),
      getJavaGenerator,
      shelljavasymbols
    ),
    python: getTranspiler(
      loadJSTree,
      getShellVisitor(getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))),
      getPythonGenerator,
      shellpythonsymbols
    ),
    csharp: getTranspiler(
      loadJSTree,
      getShellVisitor(getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))),
      getCsharpGenerator,
      shellcsharpsymbols
    ),
    javascript: getTranspiler(
      loadJSTree,
      getShellVisitor(getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))),
      getJavascriptGenerator,
      shelljavascriptsymbols
    ),
    object: getTranspiler(
      loadJSTree,
      getShellVisitor(getJavascriptVisitor(getCodeGenerationVisitor(JavascriptANTLRVisitor))),
      getObjectGenerator,
      shellobjectsymbols
    )
  },
  python: {
    java: getTranspiler(
      loadPyTree,
      getPythonVisitor(getCodeGenerationVisitor(PythonANTLRVisitor)),
      getJavaGenerator,
      pythonjavasymbols
    ),
    shell: getTranspiler(
      loadPyTree,
      getPythonVisitor(getCodeGenerationVisitor(PythonANTLRVisitor)),
      getShellGenerator,
      pythonshellsymbols
    ),
    csharp: getTranspiler(
      loadPyTree,
      getPythonVisitor(getCodeGenerationVisitor(PythonANTLRVisitor)),
      getCsharpGenerator,
      pythoncsharpsymbols
    ),
    javascript: getTranspiler(
      loadPyTree,
      getPythonVisitor(getCodeGenerationVisitor(PythonANTLRVisitor)),
      getJavascriptGenerator,
      pythonjavascriptsymbols
    ),
    object: getTranspiler(
      loadPyTree,
      getPythonVisitor(getCodeGenerationVisitor(PythonANTLRVisitor)),
      getObjectGenerator,
      pythonobjectsymbols
    )
  },
  getTree: {
    javascript: loadJSTree,
    shell: loadJSTree,
    python: loadPyTree
  }
};
