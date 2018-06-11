const antlr4 = require('antlr4');
const ECMAScriptLexer = require('./lib/antlr/ECMAScriptLexer.js');
const ECMAScriptParser = require('./lib/antlr/ECMAScriptParser.js');

const ErrorListener = require('./codegeneration/ErrorListener.js');
const { BsonCompilersInternalError } = require('./helper/error');

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

const getCompiler = (visitor, generator, symbols) => {
  const Compiler = generator(visitor);
  const compiler = new Compiler();

  const doc = yaml.load(symbols);
  Object.assign(compiler, {
    SYMBOL_TYPE: doc.SymbolTypes,
    BsonTypes: doc.BsonTypes,
    Symbols: Object.assign({}, doc.BsonSymbols, doc.JSSymbols),
    Types: Object.assign({}, doc.BasicTypes, doc.BsonTypes, doc.JSTypes),
    Syntax: doc.Syntax
  });
  return (input) => {
    try {
      const tree = loadTree(input);
      return compiler.start(tree);
    } catch (e) {
      if (e.code && e.code.includes('BSONCOMPILERS')) {
        throw e;
      }
      throw new BsonCompilersInternalError(e.message, e);
    }
  };
};

const javaImports = `
package com.example.test;

import com.mongodb.DBRef;
import org.bson.BsonBinarySubType;
import org.bson.BsonRegularExpression;
import org.bson.Document;
import org.bson.types.*;
import org.bson.BsonUndefined;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.regex.Pattern;
`;

const pythonImports = `
from bson import *
import datetime
`;

const csharpImports = `
using MongoDB.Bson;
using MongoDB.Driver;

using System;
using System.Text.RegularExpressions;
`;

const javascriptImports = `
const {
  Binary,
  Code,
  ObjectId,
  DBRef,
  Int32,
  Double,
  Long,
  Decimal128,
  MinKey,
  MaxKey,
  BSONRegExp,
  Timestamp,
  Symbol
} = require('mongodb');
`;


module.exports = {
  javascript: {
    java: getCompiler(JavascriptVisitor, JavaGenerator, javascriptjavasymbols),
    python: getCompiler(JavascriptVisitor, PythonGenerator, javascriptpythonsymbols),
    csharp: getCompiler(JavascriptVisitor, CsharpGenerator, javascriptcsharpsymbols),
    shell: getCompiler(JavascriptVisitor, ShellGenerator, javascriptshellsymbols)
  },
  shell: {
    java: getCompiler(ShellVisitor, JavaGenerator, shelljavasymbols),
    python: getCompiler(ShellVisitor, PythonGenerator, shellpythonsymbols),
    csharp: getCompiler(ShellVisitor, CsharpGenerator, shellcsharpsymbols),
    javascript: getCompiler(ShellVisitor, JavascriptGenerator, shelljavascriptsymbols)
  },
  imports: {
    java: javaImports,
    python: pythonImports,
    csharp: csharpImports,
    javascript: javascriptImports,
    shell: ''
  },
  getTree: loadTree
};
