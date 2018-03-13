// const Python3Generator = require('../codegeneration/Python3Generator.js');
// const JavaGenerator = require('../codegeneration/JavaGenerator.js');
const languageFile = require('./language-conversion.json');
const path = require('path');
const fs = require('fs');

// const pythonVisitor = new Python3Generator();
// const javaVisitor = new JavaGenerator();

const languages = fs.readFileSync(path.join(__dirname, languageFile));
console.log(languages);
