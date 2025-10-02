import { expect } from 'chai';
import { faker } from '@faker-js/faker/locale/en';
import { generateScript } from './script-generation-utils';
import type { FakerFieldMapping } from './types';

/**
 * Helper function to test that generated document code is executable
 *
 * This function takes a complete mongosh script and extracts just the document
 * generation logic to test it in isolation with the real faker.js library.
 *
 * @param script - Complete mongosh script containing a generateDocument function
 * @returns The generated document object (for any possible extra validation)
 */
function testDocumentCodeExecution(script: string): any {
  // The script contains: "function generateDocument() { return { ... }; }"
  // The "{ ... }" part is the document structure

  // Extract the return statement from the generateDocument function
  const returnMatch = script.match(/return (.*?);\s*\}/s);
  expect(returnMatch, 'Should contain return statement').to.not.be.null;

  // Get the document structure expression (everything between "return" and ";")
  // Example: "{ name: faker.person.fullName(), tags: Array.from({length: 3}, () => faker.lorem.word()) }"
  const returnExpression = returnMatch![1];

  // Create a new function
  // This is equivalent to: function(faker) { return <returnExpression>; }
  // The 'faker' parameter will receive the real faker.js library when we pass it in on call
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const generateDocument = new Function(
    'faker', // Parameter name for the faker library
    `return ${returnExpression};` // Function body: return the document structure
  );

  // Execute the function with the real faker library
  // This actually generates a document using faker methods and returns it
  return generateDocument(faker);
}

describe('Script Generation', () => {
  const createFieldMapping = (
    fakerMethod: string,
    probability?: number
  ): FakerFieldMapping => ({
    mongoType: 'String' as const,
    fakerMethod,
    fakerArgs: [],
    ...(probability !== undefined && { probability }),
  });

  it('should generate script for simple fields', () => {
    const schema = {
      name: createFieldMapping('person.fullName'),
      email: createFieldMapping('internet.email'),
    };

    const result = generateScript(schema, {
      databaseName: 'testdb',
      collectionName: 'users',
      documentCount: 5,
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      const expectedReturnBlock = `return {
    name: faker.person.fullName(),
    email: faker.internet.email()
  };`;
      expect(result.script).to.contain(expectedReturnBlock);
      expect(result.script).to.contain('use("testdb")');
      expect(result.script).to.contain('insertMany');

      // Test that the generated document code is executable
      const document = testDocumentCodeExecution(result.script);
      expect(document).to.be.an('object');
      expect(document).to.have.property('name');
      expect(document.name).to.be.a('string').and.not.be.empty;
      expect(document).to.have.property('email');
      expect(document.email).to.be.a('string').and.include('@');
    }
  });

  it('should generate script for simple arrays', () => {
    const schema = {
      'tags[]': createFieldMapping('lorem.word'),
    };

    const result = generateScript(schema, {
      databaseName: 'testdb',
      collectionName: 'posts',
      documentCount: 3,
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      expect(result.script).to.contain('Array.from');
      expect(result.script).to.contain('length: 3');
      expect(result.script).to.contain('faker.lorem.word()');

      // Test that the generated document code is executable
      const document = testDocumentCodeExecution(result.script);
      expect(document).to.be.an('object');
      expect(document).to.have.property('tags');
      expect(document.tags).to.be.an('array').with.length(3);
      expect(document.tags[0]).to.be.a('string').and.not.be.empty;
    }
  });

  it('should generate script for arrays of objects', () => {
    const schema = {
      'users[].name': createFieldMapping('person.fullName'),
      'users[].email': createFieldMapping('internet.email'),
    };

    const result = generateScript(schema, {
      databaseName: 'testdb',
      collectionName: 'teams',
      documentCount: 2,
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      const expectedReturnBlock = `return {
    users: Array.from({ length: 3 }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email()
    }))
  };`;
      expect(result.script).to.contain(expectedReturnBlock);

      // Test that the generated document code is executable
      const document = testDocumentCodeExecution(result.script);
      expect(document).to.be.an('object');
      expect(document).to.have.property('users');
      expect(document.users).to.be.an('array').with.length(3);
      expect(document.users[0]).to.have.property('name');
      expect(document.users[0].name).to.be.a('string').and.not.be.empty;
      expect(document.users[0]).to.have.property('email');
      expect(document.users[0].email).to.be.a('string').and.include('@');
    }
  });

  it('should generate script for multi-dimensional arrays', () => {
    const schema = {
      'matrix[][]': createFieldMapping('number.int'),
    };

    const result = generateScript(schema, {
      databaseName: 'testdb',
      collectionName: 'data',
      documentCount: 1,
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      const expectedReturnBlock = `return {
    matrix: Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () =>
        faker.number.int()
      )
    )
  };`;
      expect(result.script).to.contain(expectedReturnBlock);

      // Test that the generated document code is executable
      const document = testDocumentCodeExecution(result.script);
      expect(document).to.be.an('object');
      expect(document).to.have.property('matrix');
      expect(document.matrix).to.be.an('array').with.length(3);
      expect(document.matrix[0]).to.be.an('array').with.length(3);
      expect(document.matrix[0][0]).to.be.a('number');
    }
  });

  it('should generate script for arrays of objects with arrays', () => {
    const schema = {
      'users[].name': createFieldMapping('person.fullName'),
      'users[].tags[]': createFieldMapping('lorem.word'),
    };

    const result = generateScript(schema, {
      databaseName: 'testdb',
      collectionName: 'profiles',
      documentCount: 1,
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      const expectedReturnBlock = `return {
    users: Array.from({ length: 3 }, () => ({
      name: faker.person.fullName(),
      tags: Array.from({ length: 3 }, () =>
        faker.lorem.word()
      )
    }))
  };`;
      expect(result.script).to.contain(expectedReturnBlock);

      // Test that the generated document code is executable
      const document = testDocumentCodeExecution(result.script);
      expect(document).to.be.an('object');
      expect(document).to.have.property('users');
      expect(document.users).to.be.an('array').with.length(3);
      expect(document.users[0]).to.have.property('name');
      expect(document.users[0].name).to.be.a('string').and.not.be.empty;
      expect(document.users[0]).to.have.property('tags');
      expect(document.users[0].tags).to.be.an('array').with.length(3);
      expect(document.users[0].tags[0]).to.be.a('string').and.not.be.empty;
    }
  });

  it('should handle mixed field types and complex documents', () => {
    const schema = {
      title: createFieldMapping('lorem.sentence'),
      'authors[].name': createFieldMapping('person.fullName'),
      'authors[].books[]': createFieldMapping('lorem.words'),
      publishedYear: createFieldMapping('date.recent'),
    };

    const result = generateScript(schema, {
      databaseName: 'library',
      collectionName: 'publications',
      documentCount: 2,
    });

    expect(result.success).to.equal(true);
    if (result.success) {
      const expectedReturnBlock = `return {
    title: faker.lorem.sentence(),
    authors: Array.from({ length: 3 }, () => ({
      name: faker.person.fullName(),
      books: Array.from({ length: 3 }, () =>
        faker.lorem.words()
      )
    })),
    publishedYear: faker.date.recent()
  };`;
      expect(result.script).to.contain(expectedReturnBlock);

      // Test that the generated document code is executable
      const document = testDocumentCodeExecution(result.script);
      expect(document).to.be.an('object');
      expect(document).to.have.property('title');
      expect(document.title).to.be.a('string').and.not.be.empty;
      expect(document).to.have.property('authors');
      expect(document.authors).to.be.an('array').with.length(3);
      expect(document.authors[0]).to.have.property('name');
      expect(document.authors[0].name).to.be.a('string').and.not.be.empty;
      expect(document.authors[0]).to.have.property('books');
      expect(document.authors[0].books).to.be.an('array').with.length(3);
      expect(document).to.have.property('publishedYear');
      expect(document.publishedYear).to.be.a('date');
    }
  });

  describe('Edge cases', () => {
    it('should handle empty schema', () => {
      const result = generateScript(
        {},
        {
          databaseName: 'testdb',
          collectionName: 'empty',
          documentCount: 1,
        }
      );

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {};`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle single field', () => {
      const schema = {
        value: createFieldMapping('number.int'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'coll',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.number.int()');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('value');
        expect(document.value).to.be.a('number');
      }
    });

    it('should handle field names with brackets (non-array)', () => {
      const schema = {
        'settings[theme]': createFieldMapping('lorem.word'),
        'data[0]': createFieldMapping('lorem.word'),
        'bracket]field': createFieldMapping('lorem.word'),
        '[metadata': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'test',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // All fields should be treated as regular field names, not arrays
        const expectedReturnBlock = `return {
    "settings[theme]": faker.lorem.word(),
    "data[0]": faker.lorem.word(),
    "bracket]field": faker.lorem.word(),
    "[metadata": faker.lorem.word()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
        expect(result.script).not.to.contain('Array.from');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('settings[theme]');
        expect(document).to.have.property('data[0]');
        expect(document).to.have.property('bracket]field');
        expect(document).to.have.property('[metadata');
      }
    });

    it('should handle field names with [] in middle (not array notation)', () => {
      const schema = {
        'squareBrackets[]InMiddle': createFieldMapping('lorem.word'),
        'field[]WithMore': createFieldMapping('lorem.word'),
        'start[]middle[]end': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'test',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Verify these are treated as regular field names, not arrays
        expect(result.script).to.contain('"squareBrackets[]InMiddle"');
        expect(result.script).to.contain('"field[]WithMore"');
        expect(result.script).to.contain('"start[]middle[]end"');
        expect(result.script).not.to.contain('Array.from');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('squareBrackets[]InMiddle');
        expect(document).to.have.property('field[]WithMore');
        expect(document).to.have.property('start[]middle[]end');
      }
    });

    it('should safely handle special characters in database and collection names', () => {
      const schema = {
        name: createFieldMapping('person.fullName'),
      };

      // Test various special characters: quotes, newlines, tabs
      const result1 = generateScript(schema, {
        databaseName: 'test\'db`with"quotes',
        collectionName: 'coll\nwith\ttabs',
        documentCount: 1,
      });

      expect(result1.success).to.equal(true);
      if (result1.success) {
        expect(result1.script).to.contain('use("test\'db`with\\"quotes")');
        expect(result1.script).to.contain(
          'getCollection("coll\\nwith\\ttabs")'
        );
        // Should not contain unescaped special characters that could break JS
        expect(result1.script).not.to.contain("use('test'db");
        expect(result1.script).not.to.contain("getCollection('coll\nwith");

        // Test that the generated document code is executable
        testDocumentCodeExecution(result1.script);
      }

      // Test backticks and dollar signs (template literal characters)
      const result2 = generateScript(schema, {
        databaseName: 'test`${}',
        collectionName: 'collection`${}',
        documentCount: 1,
      });

      expect(result2.success).to.equal(true);
      if (result2.success) {
        // Verify the script is syntactically valid
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        expect(() => new Function(result2.script)).to.not.throw();

        // Verify template literal characters are properly escaped in console.log
        expect(result2.script).to.contain('test\\`\\${}');
        expect(result2.script).to.contain('collection\\`\\${}');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result2.script);
      }
    });

    it('should prevent code injection attacks via database and collection names', () => {
      const schema = {
        name: {
          mongoType: 'String' as const,
          fakerMethod: 'person.firstName',
          fakerArgs: [],
        },
      };

      // Test with potentially dangerous names that could inject malicious code
      const result = generateScript(schema, {
        databaseName: 'test`; require("fs").rmSync("/"); //',
        collectionName: 'my "collection"',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Verify the script is syntactically valid JavaScript
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        expect(() => new Function(result.script)).to.not.throw();

        // Verify malicious code is safely contained in string
        expect(result.script).to.contain(
          'use(\'test`; require("fs").rmSync("/"); //\')'
        );
        expect(result.script).to.contain('getCollection(\'my "collection"\')');

        // Verify template literal injection is prevented (backticks are escaped)
        expect(result.script).to.contain(
          'test\\`; require("fs").rmSync("/"); //'
        );

        // Verify malicious code in name is safely contained in code comment
        expect(result.script).to.contain(
          '// Generated for database: test`; require("fs").rmSync("/"); //; collection: my "collection"'
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should sanitize newlines in database and collection names in comments', () => {
      const schema = {
        field: {
          mongoType: 'String' as const,
          fakerMethod: 'lorem.word',
          fakerArgs: [],
        },
      };

      // Test with names containing actual newlines and carriage returns
      const result = generateScript(schema, {
        databaseName: 'test\nwith\nnewlines',
        collectionName: 'coll\rwith\r\nreturns',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Verify newlines are replaced with spaces in comments to prevent syntax errors
        expect(result.script).to.contain(
          '// Generated for database: test with newlines; collection: coll with  returns'
        );

        // Verify the script is still syntactically valid
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        expect(() => new Function(result.script)).to.not.throw();

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });
  });

  describe('Configurable Array Lengths', () => {
    it('should use default array length when no map provided', () => {
      const schema = {
        'tags[]': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'posts',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('length: 3');
        expect(result.script).to.contain('faker.lorem.word()');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('tags');
        expect(document.tags).to.be.an('array').with.length(3);
      }
    });

    it('should use custom array length from map', () => {
      const schema = {
        'tags[]': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'posts',
        documentCount: 1,
        arrayLengthMap: {
          'tags[]': 5,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('length: 5');
        expect(result.script).to.contain('faker.lorem.word()');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('tags');
        expect(document.tags).to.be.an('array').with.length(5);
      }
    });

    it('should handle nested array length configuration', () => {
      const schema = {
        'users[].tags[]': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'groups',
        documentCount: 1,
        arrayLengthMap: {
          'users[]': 5,
          'users[].tags[]': 4,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    users: Array.from({ length: 5 }, () => ({
      tags: Array.from({ length: 4 }, () =>
        faker.lorem.word()
      )
    }))
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('users');
        expect(document.users).to.be.an('array').with.length(5);
        expect(document.users[0]).to.have.property('tags');
        expect(document.users[0].tags).to.be.an('array').with.length(4);
        expect(document.users[0].tags[0]).to.be.a('string').and.not.be.empty;
      }
    });

    it('should handle zero-length arrays', () => {
      const schema = {
        'tags[]': createFieldMapping('lorem.word'),
        'categories[]': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'posts',
        documentCount: 1,
        arrayLengthMap: {
          'tags[]': 0,
          'categories[]': 2,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    tags: Array.from({ length: 0 }, () =>
      faker.lorem.word()
    ),
    categories: Array.from({ length: 2 }, () =>
      faker.lorem.word()
    )
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('tags');
        expect(document.tags).to.be.an('array').with.length(0);
        expect(document).to.have.property('categories');
        expect(document.categories).to.be.an('array').with.length(2);
      }
    });

    it('should handle multi-dimensional arrays with custom lengths', () => {
      const schema = {
        'matrix[][]': createFieldMapping('number.int'),
        'cube[][][]': createFieldMapping('number.float'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'data',
        documentCount: 1,
        arrayLengthMap: {
          'matrix[]': 2,
          'matrix[][]': 5,
          'cube[]': 3,
          'cube[][]': 4,
          'cube[][][]': 2,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    matrix: Array.from({ length: 2 }, () =>
      Array.from({ length: 5 }, () =>
        faker.number.int()
      )
    ),
    cube: Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () =>
        Array.from({ length: 2 }, () =>
          faker.number.float()
        )
      )
    )
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle complex nested array configurations', () => {
      const schema = {
        'users[].name': createFieldMapping('person.fullName'),
        'users[].tags[]': createFieldMapping('lorem.word'),
        'users[].posts[].title': createFieldMapping('lorem.sentence'),
        'users[].posts[].comments[]': createFieldMapping('lorem.words'),
        'matrix[][]': createFieldMapping('number.int'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'complex',
        documentCount: 1,
        arrayLengthMap: {
          'users[]': 2,
          'users[].tags[]': 3,
          'users[].posts[]': 4,
          'users[].posts[].comments[]': 5,
          'matrix[]': 2,
          'matrix[][]': 3,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    users: Array.from({ length: 2 }, () => ({
      name: faker.person.fullName(),
      tags: Array.from({ length: 3 }, () =>
        faker.lorem.word()
      ),
      posts: Array.from({ length: 4 }, () => ({
        title: faker.lorem.sentence(),
        comments: Array.from({ length: 5 }, () =>
          faker.lorem.words()
        )
      }))
    })),
    matrix: Array.from({ length: 2 }, () =>
      Array.from({ length: 3 }, () =>
        faker.number.int()
      )
    )
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle field names with [] in middle (not array notation)', () => {
      const schema = {
        'brackets[]InMiddle': createFieldMapping('lorem.word'),
        'items[].nested[]ArrayFieldWithBrackets[]':
          createFieldMapping('lorem.sentence'),
        'matrix[]WithBrackets[][]': createFieldMapping('number.int'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'edgecases',
        documentCount: 1,
        arrayLengthMap: {
          'items[]': 2,
          'items[].nested[]ArrayFieldWithBrackets[]': 3,
          'matrix[]WithBrackets[]': 2,
          'matrix[]WithBrackets[][]': 4,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Verify field names with [] in middle are treated as regular field names
        expect(result.script).to.contain('"brackets[]InMiddle"');
        expect(result.script).to.contain('faker.lorem.word()');

        // Verify array of objects with bracket field names containing arrays
        expect(result.script).to.contain('"nested[]ArrayFieldWithBrackets"');
        expect(result.script).to.contain('Array.from({ length: 3 }');
        expect(result.script).to.contain('faker.lorem.sentence()');

        // Verify multi-dimensional arrays with bracket field names
        expect(result.script).to.contain('"matrix[]WithBrackets"');
        expect(result.script).to.contain('Array.from({ length: 2 }');
        expect(result.script).to.contain('faker.number.int()');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');

        // Verify the three specific edge cases
        expect(document).to.have.property('brackets[]InMiddle');

        expect(document).to.have.property('items');
        expect(document.items).to.be.an('array').with.length(2);
        expect(document.items[0]).to.have.property(
          'nested[]ArrayFieldWithBrackets'
        );
        expect(document.items[0]['nested[]ArrayFieldWithBrackets'])
          .to.be.an('array')
          .with.length(3);

        expect(document).to.have.property('matrix[]WithBrackets');
        expect(document['matrix[]WithBrackets'])
          .to.be.an('array')
          .with.length(2);
        expect(document['matrix[]WithBrackets'][0])
          .to.be.an('array')
          .with.length(4);
      }
    });
  });

  describe('Unrecognized Field Defaults', () => {
    it('should use default faker method for unrecognized string fields', () => {
      const schema = {
        unknownField: {
          mongoType: 'String' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.lorem.word()');

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('unknownField');
        expect(document.unknownField).to.be.a('string').and.not.be.empty;
      }
    });

    it('should use default faker method for unrecognized number fields', () => {
      const schema = {
        unknownNumber: {
          mongoType: 'Number' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
        unknownInt: {
          mongoType: 'Int32' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
        unknownInt32: {
          mongoType: 'Int32' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
        unknownInt64: {
          mongoType: 'Long' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
        unknownLong: {
          mongoType: 'Long' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
        unknownDecimal128: {
          mongoType: 'Decimal128' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Check that integer types use faker.number.int()
        expect(result.script).to.contain('unknownNumber: faker.number.int()');
        expect(result.script).to.contain('unknownInt: faker.number.int()');
        expect(result.script).to.contain('unknownInt32: faker.number.int()');
        expect(result.script).to.contain('unknownInt64: faker.number.int()');
        expect(result.script).to.contain('unknownLong: faker.number.int()');

        // Check that decimal128 uses faker.number.float()
        expect(result.script).to.contain(
          'unknownDecimal128: faker.number.float()'
        );

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');

        // Validate integer fields
        expect(document).to.have.property('unknownNumber');
        expect(document.unknownNumber).to.be.a('number');
        expect(document).to.have.property('unknownInt');
        expect(document.unknownInt32).to.be.a('number');
        expect(document).to.have.property('unknownInt32');
        expect(document.unknownInt32).to.be.a('number');
        expect(document).to.have.property('unknownInt64');
        expect(document.unknownInt64).to.be.a('number');
        expect(document).to.have.property('unknownLong');
        expect(document.unknownLong).to.be.a('number');

        // Validate decimal field
        expect(document).to.have.property('unknownDecimal128');
        expect(document.unknownDecimal128).to.be.a('number');
      }
    });

    it('should use default faker method for unrecognized date fields', () => {
      const schema = {
        unknownDate: {
          mongoType: 'Date' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.date.recent()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should use default faker method for unrecognized boolean fields', () => {
      const schema = {
        unknownBool: {
          mongoType: 'Boolean' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.datatype.boolean()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should use default faker method for unrecognized ObjectId fields', () => {
      const schema = {
        unknownId: {
          mongoType: 'ObjectId' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.database.mongodbObjectId()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should fall back to lorem.word for unknown MongoDB types', () => {
      const schema = {
        unknownType: {
          mongoType: 'String' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.lorem.word()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should use default faker method for timestamp fields', () => {
      const schema = {
        timestampField: {
          mongoType: 'Timestamp' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.date.recent()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should use default faker method for regex fields', () => {
      const schema = {
        regexField: {
          mongoType: 'RegExp' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.lorem.word()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should use default faker method for javascript fields', () => {
      const schema = {
        jsField: {
          mongoType: 'Code' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.lorem.sentence()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });
  });

  describe('Faker Arguments', () => {
    it('should handle string arguments', () => {
      const schema = {
        name: {
          mongoType: 'String' as const,
          fakerMethod: 'person.firstName',
          fakerArgs: ['male'],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.person.firstName("male")');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle number arguments', () => {
      const schema = {
        age: {
          mongoType: 'Number' as const,
          fakerMethod: 'number.int',
          fakerArgs: [18, 65],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.number.int(18, 65)');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle JSON object arguments', () => {
      const schema = {
        score: {
          mongoType: 'Number' as const,
          fakerMethod: 'number.int',
          fakerArgs: [{ json: '{"min":0,"max":100}' }],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'tests',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.number.int(');
        expect(result.script).to.contain('min: 0');
        expect(result.script).to.contain('max: 100');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle JSON array arguments', () => {
      const schema = {
        color: {
          mongoType: 'String' as const,
          fakerMethod: 'helpers.arrayElement',
          fakerArgs: [{ json: '["red", "blue", "green"]' }],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'items',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.helpers.arrayElement(');
        expect(result.script).to.contain('red');
        expect(result.script).to.contain('blue');
        expect(result.script).to.contain('green');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle mixed argument types', () => {
      const schema = {
        description: {
          mongoType: 'String' as const,
          fakerMethod: 'lorem.words',
          fakerArgs: [5, true],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'posts',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.lorem.words(5, true)');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should safely handle quotes and special characters in string arguments', () => {
      const schema = {
        quote: {
          mongoType: 'String' as const,
          fakerMethod: 'helpers.arrayElement',
          fakerArgs: [
            { json: '["It\'s a \'test\' string", "another option"]' },
          ],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'quotes',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.helpers.arrayElement(');
        expect(result.script).to.contain("It's a 'test' string");
        expect(result.script).to.contain('another option');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle empty arguments array', () => {
      const schema = {
        id: {
          mongoType: 'String' as const,
          fakerMethod: 'string.uuid',
          fakerArgs: [],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'items',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.string.uuid()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });
  });

  describe('Probability Handling', () => {
    it('should generate normal faker call for probability 1.0', () => {
      const schema = {
        name: createFieldMapping('person.fullName', 1.0),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).not.to.contain('Math.random()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should generate normal faker call when probability is undefined', () => {
      const schema = {
        name: createFieldMapping('person.fullName'), // No probability specified
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).not.to.contain('Math.random()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should default invalid probability to 1.0', () => {
      const schema = {
        field1: {
          mongoType: 'String' as const,
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          probability: 1.5, // Invalid - should default to 1.0
        },
        field2: {
          mongoType: 'String' as const,
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          probability: -0.5, // Invalid - should default to 1.0
        },
      };

      const result = generateScript(schema, {
        databaseName: 'test',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // All fields should be treated as probability 1.0 (always present)
        const expectedReturnBlock = `return {
    field1: faker.lorem.word(),
    field2: faker.lorem.word()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
        expect(result.script).not.to.contain('Math.random()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should use probabilistic rendering when probability < 1.0', () => {
      const schema = {
        optionalField: createFieldMapping('lorem.word', 0.7),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'posts',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    ...(Math.random() < 0.7
      ? { optionalField: faker.lorem.word() }
      : {})
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle mixed probability fields', () => {
      const schema = {
        alwaysPresent: createFieldMapping('person.fullName', 1.0),
        sometimesPresent: createFieldMapping('internet.email', 0.8),
        rarelyPresent: createFieldMapping('phone.number', 0.2),
        defaultProbability: createFieldMapping('lorem.word'), // undefined = 1.0
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    alwaysPresent: faker.person.fullName(),
    ...(Math.random() < 0.8
      ? {
          sometimesPresent: faker.internet.email()
        }
      : {}),
    ...(Math.random() < 0.2
      ? { rarelyPresent: faker.phone.number() }
      : {}),
    defaultProbability: faker.lorem.word()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
        expect(result.script).not.to.contain(
          'Math.random() < 1 ? { alwaysPresent:'
        );
        expect(result.script).not.to.contain(
          'Math.random() < 1 ? { defaultProbability:'
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle probability with faker arguments', () => {
      const schema = {
        conditionalAge: {
          mongoType: 'Number' as const,
          fakerMethod: 'number.int',
          fakerArgs: [18, 65],
          probability: 0.9,
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('Math.random() < 0.9');
        expect(result.script).to.contain('faker.number.int(18, 65)');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle probability with unrecognized fields', () => {
      const schema = {
        unknownField: {
          mongoType: 'String' as const,
          fakerMethod: 'unrecognized',
          fakerArgs: [],
          probability: 0.5,
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('Math.random() < 0.5');
        expect(result.script).to.contain('faker.lorem.word()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });
  });
});
