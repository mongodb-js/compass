import { expect } from 'chai';
import { generateScript, type FieldMapping } from './script-generation-utils';

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
        const expectedReturnBlock = `return {
    name: faker.person.fullName(),
    email: faker.internet.email()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
        expect(result.script).to.contain("use('testdb')");
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
        const expectedReturnBlock = `return {
    tags: Array.from({length: 3}, () => faker.lorem.word())
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
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
    users: Array.from({length: 3}, () => {
      name: faker.person.fullName(),
      email: faker.internet.email()
    })
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
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
    users: Array.from({length: 3}, () => {
      name: faker.person.fullName(),
      tags: Array.from({length: 3}, () => faker.lorem.word())
    })
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
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
        const expectedReturnBlock = `return {
    users: Array.from({length: 3}, () => {
      profile: {
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city()
        }
      }
    })
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
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
        const expectedReturnBlock = `return {
    title: faker.lorem.sentence(),
    authors: Array.from({length: 3}, () => {
      name: faker.person.fullName(),
      books: Array.from({length: 3}, () => faker.lorem.words())
    }),
    publishedYear: faker.date.recent()
  };`;
        expect(result.script).to.contain(expectedReturnBlock);
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
        const expectedReturnBlock = `return {};`;
        expect(result.script).to.contain(expectedReturnBlock);
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
        expect(result.script).to.contain(
          '...(Math.random() < 0.7 ? { optionalField: faker.lorem.word() } : {})'
        );
      }
    });

    it('should handle zero probability', () => {
      const schema = {
        rareField: createFieldMapping('lorem.word', 0),
      };

      const result = generateScript(schema, {
        databaseName: 'testdb',
        collectionName: 'posts',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.script).to.contain(
          '...(Math.random() < 0 ? { rareField: faker.lorem.word() } : {})'
        );
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
        // Always present (probability 1.0)
        expect(result.script).to.contain('faker.person.fullName()');
        expect(result.script).not.to.contain(
          'Math.random() < 1 ? { alwaysPresent:'
        );

        // Sometimes present (probability 0.8)
        expect(result.script).to.contain(
          '...(Math.random() < 0.8 ? { sometimesPresent: faker.internet.email() } : {})'
        );

        // Rarely present (probability 0.2)
        expect(result.script).to.contain(
          '...(Math.random() < 0.2 ? { rarelyPresent: faker.phone.number() } : {})'
        );

        // Default probability (undefined = 1.0)
        expect(result.script).to.contain('faker.lorem.word()');
        expect(result.script).not.to.contain(
          'Math.random() < 1 ? { defaultProbability:'
        );
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
      }
    });
  });

  describe('Graceful Handling', () => {
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
        expect(result.script).to.contain('field1: faker.lorem.word()');
        expect(result.script).to.contain('field2: faker.lorem.word()');
        expect(result.script).to.contain('field3: faker.lorem.word()');
        expect(result.script).not.to.contain('Math.random()');
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
        expect(result.script).to.contain('settings[theme]: faker.lorem.word()');
        expect(result.script).to.contain('data[0]: faker.lorem.word()');
        expect(result.script).to.contain('bracket]field: faker.lorem.word()');
        expect(result.script).to.contain('[metadata: faker.lorem.word()');
        expect(result.script).not.to.contain('Array.from');
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
        expect(result.script).to.contain(
          'squareBrackets[]InMiddle: faker.lorem.word()'
        );
        expect(result.script).to.contain('field[]WithMore: faker.lorem.word()');
        expect(result.script).to.contain(
          'start[]middle[]end: faker.lorem.word()'
        );
        expect(result.script).not.to.contain('Array.from');
      }
    });

    it('should still handle real array notation correctly', () => {
      const schema = {
        'realArray[]': createFieldMapping('lorem.word'),
        'nestedArray[].field': createFieldMapping('lorem.word'),
      };

      const result = generateScript(schema, {
        databaseName: 'test',
        collectionName: 'test',
        documentCount: 1,
      });

      expect(result.success).to.equal(true);
      if (result.success) {
        // These should be treated as arrays
        expect(result.script).to.contain('Array.from');
        expect(result.script).to.contain('realArray: Array.from');
        expect(result.script).to.contain('nestedArray: Array.from');
      }
    });
  });
});
