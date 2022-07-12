/* eslint-disable no-sync */
const path = require('path');

const fs = require('fs');

const yaml = require('js-yaml');

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
 * @param {String} dir - Directory to write to
 * @param {String} inputLang - Input language
 * @param {String} outputLang - Output language
 */
const loadSymbolTable = (dir, inputLang, outputLang) => {
  const outputFile = path.join(dir, `${inputLang}to${outputLang}.js`);
  const files = [
    'main.yaml',
    path.join(outputLang, 'templates.yaml'),
    'basic_types.yaml',
    'syntax_templates.yaml',
    'import_templates.yaml',
    path.join(inputLang, 'types.yaml'),
    path.join(inputLang, 'symbols.yaml')
  ];
  const contents = files.reduce((str, file) => {
    if (!fs.existsSync(path.join('symbols', file))) {
      throw new Error(`${inputLang} not yet implemented as input language`);
    }
    return str + fs.readFileSync(path.join('symbols', file));
  }, '');
  yaml.load(contents); // load contents so YAML errors are caught here
  fs.writeFileSync(outputFile, `module.exports=${JSON.stringify(contents)};\n`);
};

const loadAll = () => {
  const dir = path.join(__dirname, 'lib', 'symbol-table');
  const inputLangs = ['javascript', 'shell', 'python'];
  const outputLangs = ['java', 'shell', 'python', 'csharp', 'javascript', 'object', 'ruby', 'go', 'rust', 'php'];
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  inputLangs.forEach((input) => {
    outputLangs.forEach((output) => {
      if (input !== output) {
        loadSymbolTable(dir, input, output);
      }
    });
  });
};

loadAll();
