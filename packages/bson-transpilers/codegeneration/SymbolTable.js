const path = require('path');

const yaml = require('js-yaml');
const fs = require('fs');

/*
 * Symbols represent classes, variables, and functions. Each Symbol has:
 *
 * {String} id - identifier. TODO: for now, internals start with _
 * {Number} callable - if it's a function, constructor, or variable.
 * {Array} args - arguments if its callable. An array of tuples where
 * each tuple has each possible type for the argument at that index.
 * {Symbol} type - the type the symbol returns. Could be a Symbol or
 * 0 if it's a primitive type.
 * {Scope} attrs - the attributes of the returned type. TODO: do we want to strictly check all objs or just BSON/Built-in.
 * {Function} template - the string template for this type. This is the first
 * step in (slowly) extracting any language-specific code out of the visitor so that
 * we can use the same visitor for every export language. Eventually, each type that
 * needs translation will include a string template that we can swap out depending
 * on what language we're compiling to. The visitor will be mostly be controlling
 * the order of nodes visited and handling edge cases.
 * {Function} argsTemplate - the string template for the arguments if this
 * is a call.
 **/

/**
 * Scope represents both namespaces and variable scope. Eventually the
 * data structure we're going to use for scopes will have the ability to
 * push/pop scopes, lookup variables, add variables to scope, and handle
 * collisions. For now it's just an object.
 *
 * @param {String} inputLang - Input language
 * @param {String} outputLang - Output language
 *
 * @returns {Object} SymbolTable
 */
const loadSymbolTable = (inputLang, outputLang) => {
  const files = [
    'main.yaml',
    path.join(outputLang, 'templates.yaml'),
    'basic_types.yaml',
    path.join(inputLang, 'types.yaml'),
    path.join(inputLang, 'symbols.yaml')
  ];
  const contents = files.reduce((str, file) => {
    return str + fs.readFileSync(path.join('symbols', file));
  }, '');

  // write a file so debugging is easier with linenumbers
  // fs.writeFileSync('concatted.yaml', contents);
  const doc = yaml.load(contents);
  return [
    doc.SymbolTypes,
    doc.BsonTypes,
    Object.assign({}, doc.BsonSymbols, doc.JSSymbols),
    Object.assign({}, doc.BasicTypes, doc.BsonTypes, doc.JSTypes)
  ];
};

module.exports = { loadSymbolTable };

