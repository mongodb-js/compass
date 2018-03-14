const Python3Generator = require('../codegeneration/Python3Generator.js');
const JavaGenerator = require('../codegeneration/JavaGenerator.js');
const languageFile = require('./language-conversion.json');
const compileECMAScript = require('../');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');

const pythonVisitor = new Python3Generator();
const javaVisitor = new JavaGenerator();

const constructorJSON = fs.readFileSync(path.join(__dirname, languageFile));
const languages = constructorJSON.languages;
const bsonTypes = constructorJSON.bsonTypes;

for (let i = 0; i < languages; i ++) {
  if (languages[i] === 'python') {
    const generator = pythonVisitor;
    runConstructorTests('javascript', languages[i], generator);
  } else if (languages[i] === 'java') {
    const generator = javaVisitor;
    runConstructorTests('javascript', languages[i], generator);
  }
}

function runConstructorTests(inputLang, outputLang, generator) {
  describe('BSONConstructor Tests', () => {
    for (let i = 0; i < bsonTypes; i++) {
      it(`${bsonTypes[i]} for ${outputLang} is generated`, () => {
        expect(compileECMAScript(bsonTypes[i][inputLang], generator)).to.equal(bsonTypes[i][outputLang]);
      });
    }
  });
}
