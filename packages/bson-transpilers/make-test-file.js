#!/usr/bin/env node

const fs = require('fs');
const parse = require('fast-json-parse');
const path = require('path');
const pSuccess = path.join(__dirname, 'test', 'json', 'success');
const { singleQuoteStringify, doubleQuoteStringify } = require('./helper/format');
const { imports } = require('.');

if (process.argv.length !== 3) {
  console.log('Usage: <outputLanguage>');
  process.exit();
}
const output = process.argv[2].toLowerCase();
if (!['python', 'csharp', 'java', 'javascript'].includes(output)) {
  console.log(`${output} not a supported language`);
  process.exit();
}

const javaFileTemplate = (code) => {
  return `${imports.java}

public class Test {
    public void all() throws Exception {
        try {
            ${code}
        } catch (Exception e) {
            System.out.println("failure");
            throw e;
        }

    }
    public static void main(String[] args) throws Exception {
        Test test = new Test();
        test.all();
    }
}`;
};

const javaDocTemplate = (name, code) => {
  return `
\t\tDocument ${name} = new Document()${code};`;
};

const javaLineTemplate = (description, result) => {
  return `\n\t\t\t.append(${doubleQuoteStringify(description)}, ${result})`;
};

const pythonFileTemplate = (code) => {
  return `${imports.python}
x = {
    ${code}
}
print(x)
`;
};

const pythonDocTemplate = (name, code) => {
  return `\n    ${singleQuoteStringify(name)}: {${code}\n    },\n`;
};

const pythonLineTemplate = (description, result) => {
  return `\n        ${singleQuoteStringify(description)}: ${result},`;
};

const csharpFileTemplate = (code) => {
  return `${imports.csharp}
namespace csharp_test
{
    class Program
    {
        static void Main(string[] args)
        {
            ${code}
            Console.WriteLine("executed chsarp testfile");
        }
    }
}`;
};

const csharpDocTemplate = (name, code) => {
  return `
\t\tvar ${name} = new BsonDocument{${code}};`;
};

const csharpLineTemplate = (description, result) => {
  return `\n\t\t\t{ ${doubleQuoteStringify(description)}, ${result} },`;
};

const jsFileTemplate = (code) => {
  return `${imports.javascript}
x = {
  ${code}
}
console.log(x)
`;
};
const jsDocTemplate = (name, code) => {
  return `\n  ${singleQuoteStringify(name)}: {${code}\n  },\n`;
};

const jsLineTemplate = (description, result) => {
  return `\n    ${singleQuoteStringify(description)}: ${result},`;
};

const templates = {
  python: {
    file: pythonFileTemplate,
    doc: pythonDocTemplate,
    line: pythonLineTemplate
  },
  java: {
    file: javaFileTemplate,
    doc: javaDocTemplate,
    line: javaLineTemplate
  },
  csharp: {
    file: csharpFileTemplate,
    doc: csharpDocTemplate,
    line: csharpLineTemplate
  },
  javascript: {
    file: jsFileTemplate,
    doc: jsDocTemplate,
    line: jsLineTemplate
  }
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(filename));
  if (parseResult.err) {
    throw new Error(parseResult.err.message);
  }
  return parseResult.value;
};

const makeFile = (input) => {
  return templates[output].file(fs.readdirSync(path.join(pSuccess, input)).reduce(
    (str0, file) => {
      const tests = readJSON(path.join(pSuccess, input, file)).tests;
      return str0 + Object.keys(tests).reduce(
        (str, key) => {
          return str + templates[output].doc(file.replace(/-/g, '').slice(0, -5) + key, tests[key].reduce(
            (str2, test) => {
              return str2 + templates[output].line(test.description, test[output]);
            }, ''));
        }, '');
    }, ''));
};
console.log(makeFile('javascript'));
