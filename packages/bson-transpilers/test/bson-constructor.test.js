const Python3Generator = require('../codegeneration/Python3Generator.js');
const JavaGenerator = require('../codegeneration/JavaGenerator.js');
const compileECMAScript = require('../');
const parse = require('fast-json-parse');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');

const pythonVisitor = new Python3Generator();
const javaVisitor = new JavaGenerator();

const parseResult = parse(fs.readFileSync(path.join(__dirname, './language-conversion.json')));
// if an error is returned from parsing json, just throw it
if (parseResult.err) throw new Error(parseResult.err.message);
const constructorJSON = parseResult.value;

const languages = constructorJSON.inputLanguages;
const bsonTypes = constructorJSON.bsonTypes;

languages.forEach((lang) => {
  if (lang === 'python') {
    const generator = pythonVisitor;
    runConstructorTests('javascript', lang, generator);
  } else if (lang === 'java') {
    const generator = javaVisitor;
    runConstructorTests('javascript', lang, generator);
  }
});

function runConstructorTests(inputLang, outputLang, generator) {
  describe('BSONConstructor Tests', () => {
    Object.keys(bsonTypes).forEach((key) => {
      it(`${key} for ${outputLang} is generated`, () => {
        expect(compileECMAScript(bsonTypes[key][inputLang], generator)).to.equal(bsonTypes[key][outputLang]);
      });
    });
  });
}
