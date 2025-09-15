import { expect } from 'chai';
import { faker } from '@faker-js/faker/locale/en';
import { generateScript, type FieldMapping } from './script-generation-utils';

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
  const returnMatch = script.match(/return ([\s\S]*?);[\s]*\}/);
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
  ): FieldMapping => ({
    mongoType: 'String',
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
      const expectedReturnBlock = `return {
    tags: Array.from({length: 3}, () => faker.lorem.word())
  };`;
      expect(result.script).to.contain(expectedReturnBlock);

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
      // Should generate the complete return block with proper structure
      const expectedReturnBlock = `return {
    users: Array.from({length: 3}, () => ({
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
    matrix: Array.from({length: 3}, () => Array.from({length: 3}, () => faker.number.int()))
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
    users: Array.from({length: 3}, () => ({
      name: faker.person.fullName(),
      tags: Array.from({length: 3}, () => faker.lorem.word())
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
    authors: Array.from({length: 3}, () => ({
      name: faker.person.fullName(),
      books: Array.from({length: 3}, () => faker.lorem.words())
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
        const expectedReturnBlock = `return {
    value: faker.number.int()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

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
        // These should be treated as regular field names, not arrays
        const expectedReturnBlock = `return {
    "squareBrackets[]InMiddle": faker.lorem.word(),
    "field[]WithMore": faker.lorem.word(),
    "start[]middle[]end": faker.lorem.word()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
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

      const result = generateScript(schema, {
        databaseName: 'test\'db`with"quotes',
        collectionName: 'coll\nwith\ttabs',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Should use JSON.stringify for safe string insertion
        expect(result.script).to.contain('use("test\'db`with\\"quotes")');
        expect(result.script).to.contain(
          'db.getCollection("coll\\nwith\\ttabs")'
        );
        // Should not contain unescaped special characters that could break JS
        expect(result.script).not.to.contain("use('test'db");
        expect(result.script).not.to.contain("getCollection('coll\nwith");
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
        const expectedReturnBlock = `return {
    tags: Array.from({length: 3}, () => faker.lorem.word())
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

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
          tags: [5],
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    tags: Array.from({length: 5}, () => faker.lorem.word())
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

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
          users: {
            length: 5,
            elements: {
              tags: [4],
            },
          },
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    users: Array.from({length: 5}, () => ({
      tags: Array.from({length: 4}, () => faker.lorem.word())
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
          tags: [0],
          categories: [2],
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Should have tags array with length 0 (empty array) and categories with length 2
        const expectedReturnBlock = `return {
    tags: Array.from({length: 0}, () => faker.lorem.word()),
    categories: Array.from({length: 2}, () => faker.lorem.word())
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
          matrix: [2, 5], // 2x5 matrix
          cube: [3, 4, 2], // 3x4x2 cube
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        const expectedReturnBlock = `return {
    matrix: Array.from({length: 2}, () => Array.from({length: 5}, () => faker.number.int())),
    cube: Array.from({length: 3}, () => Array.from({length: 4}, () => Array.from({length: 2}, () => faker.number.float())))
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
          users: {
            length: 2,
            elements: {
              tags: [3],
              posts: {
                length: 4,
                elements: {
                  comments: [5],
                },
              },
            },
          },
          matrix: [2, 3],
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Complex nested structure with custom array lengths
        const expectedReturnBlock = `return {
    users: Array.from({length: 2}, () => ({
      name: faker.person.fullName(),
      tags: Array.from({length: 3}, () => faker.lorem.word()),
      posts: Array.from({length: 4}, () => ({
        title: faker.lorem.sentence(),
        comments: Array.from({length: 5}, () => faker.lorem.words())
      }))
    })),
    matrix: Array.from({length: 2}, () => Array.from({length: 3}, () => faker.number.int()))
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });
  });

  describe('Unrecognized Field Defaults', () => {
    it('should use default faker method for unrecognized string fields', () => {
      const schema = {
        unknownField: {
          mongoType: 'string',
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
        const expectedReturnBlock = `return {
    unknownField: faker.lorem.word()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

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
          mongoType: 'number',
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
        const expectedReturnBlock = `return {
    unknownNumber: faker.number.int()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);

        // Test that the generated document code is executable
        const document = testDocumentCodeExecution(result.script);
        expect(document).to.be.an('object');
        expect(document).to.have.property('unknownNumber');
        expect(document.unknownNumber).to.be.a('number');
      }
    });

    it('should use default faker method for unrecognized date fields', () => {
      const schema = {
        unknownDate: {
          mongoType: 'date',
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
          mongoType: 'boolean',
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
          mongoType: 'objectid',
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

    it('should use default faker method for unrecognized double fields', () => {
      const schema = {
        unknownDouble: {
          mongoType: 'double',
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
        expect(result.script).to.contain('faker.number.float()');

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should fall back to lorem.word for unknown MongoDB types', () => {
      const schema = {
        unknownType: {
          mongoType: 'unknownType',
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
  });

  describe('Faker Arguments', () => {
    it('should handle string arguments', () => {
      const schema = {
        name: {
          mongoType: 'string',
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
          mongoType: 'number',
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
          mongoType: 'number',
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
        expect(result.script).to.contain(
          'faker.number.int({"min":0,"max":100})'
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle JSON array arguments', () => {
      const schema = {
        color: {
          mongoType: 'string',
          fakerMethod: 'helpers.arrayElement',
          fakerArgs: [{ json: "['red', 'blue', 'green']" }],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'items',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain(
          "faker.helpers.arrayElement(['red', 'blue', 'green'])"
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle mixed argument types', () => {
      const schema = {
        description: {
          mongoType: 'string',
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
          mongoType: 'string',
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
        expect(result.script).to.contain(
          'faker.helpers.arrayElement(["It\'s a \'test\' string", "another option"])'
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle empty arguments array', () => {
      const schema = {
        id: {
          mongoType: 'string',
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
          mongoType: 'string',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          probability: 1.5, // Invalid - should default to 1.0
        },
        field2: {
          mongoType: 'string',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          probability: -0.5, // Invalid - should default to 1.0
        },
        field3: {
          mongoType: 'string',
          fakerMethod: 'lorem.word',
          fakerArgs: [],
          probability: 'invalid' as any, // Invalid - should default to 1.0
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
    field2: faker.lorem.word(),
    field3: faker.lorem.word()
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
    ...(Math.random() < 0.7 ? { optionalField: faker.lorem.word() } : {})
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
    ...(Math.random() < 0.8 ? { sometimesPresent: faker.internet.email() } : {}),
    ...(Math.random() < 0.2 ? { rarelyPresent: faker.phone.number() } : {}),
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
          mongoType: 'number',
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
        expect(result.script).to.contain(
          '...(Math.random() < 0.9 ? { conditionalAge: faker.number.int(18, 65) } : {})'
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });

    it('should handle probability with unrecognized fields', () => {
      const schema = {
        unknownField: {
          mongoType: 'string',
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
        expect(result.script).to.contain(
          '...(Math.random() < 0.5 ? { unknownField: faker.lorem.word() } : {})'
        );

        // Test that the generated document code is executable
        testDocumentCodeExecution(result.script);
      }
    });
  });
});
