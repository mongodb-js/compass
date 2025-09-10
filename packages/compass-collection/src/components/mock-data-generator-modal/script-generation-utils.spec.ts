import { expect } from 'chai';
import { generateScript, type FieldMapping } from './script-generation-utils';

describe('Script Generation', () => {
  const createFieldMapping = (fakerMethod: string): FieldMapping => ({
    mongoType: 'String',
    fakerMethod,
    fakerArgs: [],
  });

  describe('Basic field generation', () => {
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
        expect(result.script).to.contain("use('testdb')");
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).to.contain('faker.internet.email()');
        expect(result.script).to.contain('insertMany');
      }
    });
  });

  describe('Array generation', () => {
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
        expect(result.script).to.contain('faker.lorem.word()');
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
        expect(result.script).to.contain('Array.from');
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).to.contain('faker.internet.email()');
        // Should have nested object structure
        expect(result.script).to.match(/name:\s*faker\.person\.fullName\(\)/);
        expect(result.script).to.match(/email:\s*faker\.internet\.email\(\)/);
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
        // Should have nested Array.from calls
        expect(result.script).to.contain('Array.from');
        expect(result.script).to.contain('faker.number.int()');
        // Should have two levels of Array.from for 2D array
        const arrayFromMatches = result.script.match(/Array\.from/g);
        expect(arrayFromMatches?.length).to.be.greaterThanOrEqual(2);
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
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).to.contain('faker.lorem.word()');
        // Should have nested structure: users array containing objects with tags arrays
        expect(result.script).to.match(/name:\s*faker\.person\.fullName\(\)/);
        expect(result.script).to.match(/tags:\s*Array\.from/);
      }
    });
  });

  describe('Complex nested structures', () => {
    it('should handle deeply nested object paths', () => {
      const schema = {
        'users[].profile.address.street': createFieldMapping(
          'location.streetAddress'
        ),
        'users[].profile.address.city': createFieldMapping('location.city'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'accounts',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.location.streetAddress()');
        expect(result.script).to.contain('faker.location.city()');
        // Should have nested object structure
        expect(result.script).to.contain('profile');
        expect(result.script).to.contain('address');
      }
    });

    it('should handle mixed field types', () => {
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
        expect(result.script).to.contain('faker.lorem.sentence()');
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).to.contain('faker.lorem.words()');
        expect(result.script).to.contain('faker.date.recent()');
      }
    });
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
        expect(result.script).to.contain("use('testdb')");
        expect(result.script).to.contain('insertMany');
        // Should generate empty objects
        expect(result.script).to.contain('{}');
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
        expect(result.script).to.match(/value:\s*faker\.number\.int\(\)/);
      }
    });

    it('should handle multiple fields in the same nested object', () => {
      const schema = {
        'profile.name': createFieldMapping('person.fullName'),
        'profile.email': createFieldMapping('internet.email'),
        'profile.age': createFieldMapping('number.int'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // All three fields should be present in the same profile object
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).to.contain('faker.internet.email()');
        expect(result.script).to.contain('faker.number.int()');
        expect(result.script).to.contain('profile');
        // Should have all fields in nested structure
        expect(result.script).to.match(/name:\s*faker\.person\.fullName\(\)/);
        expect(result.script).to.match(/email:\s*faker\.internet\.email\(\)/);
        expect(result.script).to.match(/age:\s*faker\.number\.int\(\)/);
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
        expect(result.script).to.contain('Array.from({length: 3}');
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
          tags: 5,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('Array.from({length: 5}');
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
            tags: 4,
          },
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Should have tags array with length 4
        expect(result.script).to.contain('Array.from({length: 4}');
      }
    });

    it('should handle hierarchical array length map', () => {
      const schema = {
        'departments[].employees[].skills[]': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'company',
        documentCount: 1,
        arrayLengthMap: {
          departments: {
            employees: {
              skills: 3,
            },
          },
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('Array.from({length: 3}');
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
          tags: 0,
          categories: 2,
        },
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // Should have tags array with length 0 (empty array)
        expect(result.script).to.contain('Array.from({length: 0}');
        // Should have categories array with length 2
        expect(result.script).to.contain('Array.from({length: 2}');
        // Verify both arrays are present
        expect(result.script).to.contain('tags:');
        expect(result.script).to.contain('categories:');
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
        expect(result.script).to.contain('faker.lorem.word()');
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
        expect(result.script).to.contain('faker.number.int()');
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
        expect(result.script).to.contain("faker.person.firstName('male')");
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
      }
    });

    it('should handle boolean arguments', () => {
      const schema = {
        active: {
          mongoType: 'boolean',
          fakerMethod: 'datatype.boolean',
          fakerArgs: [0.8],
        },
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'users',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain('faker.datatype.boolean(0.8)');
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
      }
    });

    it('should handle JSON arguments', () => {
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
      }
    });

    it('should escape quotes in string arguments', () => {
      const schema = {
        quote: {
          mongoType: 'string',
          fakerMethod: 'lorem.sentence',
          fakerArgs: ["It's a 'test' string"],
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
          "faker.lorem.sentence('It\\'s a \\'test\\' string')"
        );
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
      }
    });
  });
});
