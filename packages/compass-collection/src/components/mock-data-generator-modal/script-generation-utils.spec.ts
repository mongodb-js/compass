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
});
