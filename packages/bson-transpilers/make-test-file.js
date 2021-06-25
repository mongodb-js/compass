#!/usr/bin/env node
/* eslint-disable no-sync */
/* eslint-disable no-console */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const testpath = path.join(__dirname, 'test', 'yaml');
const { singleQuoteStringify, doubleQuoteStringify } = require('./helper/format');

if (process.argv.length !== 3) {
  console.log('Usage: <outputLanguage> | pbcopy (or > testfile)');
  process.exit();
}
const output = process.argv[2].toLowerCase();
if (!['python', 'csharp', 'java', 'javascript'].includes(output)) {
  console.log(`${output} not a supported language`);
  process.exit();
}

const readYAML = (filename) => {
  let parseResult;
  try {
    parseResult = yaml.load(fs.readFileSync(filename));
  } catch (err) {
    err.message = `${filename}: ${err.message}`;
    throw err;
  }
  return parseResult;
};

const getAllImports = () => {
  const importtests = readYAML(path.join(testpath, 'imports.yaml'));
  return importtests.tests.every[0].output[output];
};

const imports = getAllImports();

const javaFileTemplate = (code) => {
  return `${imports}

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
  return `${imports}
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
  return `${imports}
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
  return `${imports}
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

const makeFile = (side) => {
  return templates[output].file(fs.readdirSync(testpath).reduce(
    (str0, file) => {
      if (!file.startsWith('error') && !file.startsWith('edge') && !file.startsWith('imports') && !file.startsWith('partial') && !file.startsWith('builders')) {
        const tests = readYAML(path.join(testpath, file)).tests;
        return str0 + Object.keys(tests).reduce(
          (str, key) => {
            let name = file.slice(0, -5) + key;
            name = name.replace(/\/|-|\s/g, '');
            return str + templates[output].doc(name, tests[key].reduce(
              (str2, test) => {
                if (output in test[side] && test[side][output] !== '') {
                  const desc = 'description' in test ? test.description : 'x';
                  const line = templates[output].line(desc, test[side][output]);
                  return str2 + line;
                }
                return str2;
              }, ''));
          }, '');
      }
      return str0;
    }, ''));
};
console.log(makeFile('output'));
