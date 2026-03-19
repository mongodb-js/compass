import { expect } from 'chai';
import type { MockDataSchemaToolOutput, RawSchema } from './schema';
import {
  splitSchemaIntoChunks,
  mergeChunkResponses,
  validateSchemaSize,
  needsBatching,
  FIELDS_PER_CHUNK,
  MAX_CHUNKS,
} from './schema-batching';

function makeSchema(fieldCount: number): RawSchema {
  const schema: RawSchema = {};
  for (let i = 0; i < fieldCount; i++) {
    schema[`field_${i}`] = { type: 'string' };
  }
  return schema;
}

describe('schemaBatching', function () {
  describe('splitSchemaIntoChunks', function () {
    it('returns empty array for empty schema', function () {
      expect(splitSchemaIntoChunks({})).to.deep.equal([]);
    });

    it('returns single chunk when fields <= fieldsPerChunk', function () {
      const schema = makeSchema(10);
      const chunks = splitSchemaIntoChunks(schema);
      expect(chunks).to.have.lengthOf(1);
      expect(Object.keys(chunks[0])).to.have.lengthOf(10);
    });

    it('returns single chunk when fields equals fieldsPerChunk', function () {
      const schema = makeSchema(FIELDS_PER_CHUNK);
      const chunks = splitSchemaIntoChunks(schema);
      expect(chunks).to.have.lengthOf(1);
      expect(Object.keys(chunks[0])).to.have.lengthOf(FIELDS_PER_CHUNK);
    });

    it('splits into multiple chunks when fields > fieldsPerChunk', function () {
      const schema = makeSchema(FIELDS_PER_CHUNK + 10);
      const chunks = splitSchemaIntoChunks(schema);
      expect(chunks).to.have.lengthOf(2);
      expect(Object.keys(chunks[0])).to.have.lengthOf(FIELDS_PER_CHUNK);
      expect(Object.keys(chunks[1])).to.have.lengthOf(10);
    });

    it('preserves field order across chunks', function () {
      const schema = makeSchema(5);
      const chunks = splitSchemaIntoChunks(schema, 2);
      expect(Object.keys(chunks[0])).to.deep.equal(['field_0', 'field_1']);
      expect(Object.keys(chunks[1])).to.deep.equal(['field_2', 'field_3']);
      expect(Object.keys(chunks[2])).to.deep.equal(['field_4']);
    });

    it('preserves field data in chunks', function () {
      const schema: RawSchema = {
        name: { type: 'string', sampleValues: ['John'] },
        age: { type: 'number' },
      };
      const chunks = splitSchemaIntoChunks(schema, 1);
      expect(chunks[0]).to.deep.equal({
        name: { type: 'string', sampleValues: ['John'] },
      });
      expect(chunks[1]).to.deep.equal({ age: { type: 'number' } });
    });

    it('respects custom fieldsPerChunk', function () {
      const schema = makeSchema(10);
      const chunks = splitSchemaIntoChunks(schema, 3);
      expect(chunks).to.have.lengthOf(4);
      expect(Object.keys(chunks[3])).to.have.lengthOf(1);
    });
  });

  describe('mergeChunkResponses', function () {
    it('returns empty fields for empty array', function () {
      expect(mergeChunkResponses([])).to.deep.equal({ fields: [] });
    });

    it('returns single response unchanged', function () {
      const response: MockDataSchemaToolOutput = {
        fields: [
          { fieldPath: 'name', fakerMethod: 'person.fullName', fakerArgs: [] },
        ],
      };
      expect(mergeChunkResponses([response])).to.deep.equal(response);
    });

    it('merges fields from multiple responses', function () {
      const responses: MockDataSchemaToolOutput[] = [
        {
          fields: [
            {
              fieldPath: 'name',
              fakerMethod: 'person.fullName',
              fakerArgs: [],
            },
          ],
        },
        {
          fields: [
            {
              fieldPath: 'age',
              fakerMethod: 'number.int',
              fakerArgs: [{ json: '{"min": 18, "max": 65}' }],
            },
          ],
        },
      ];
      const merged = mergeChunkResponses(responses);
      expect(merged.fields).to.have.lengthOf(2);
      expect(merged.fields[0].fieldPath).to.equal('name');
      expect(merged.fields[1].fieldPath).to.equal('age');
    });

    it('preserves field order across chunks', function () {
      const responses: MockDataSchemaToolOutput[] = [
        {
          fields: [
            { fieldPath: 'a', fakerMethod: 'lorem.word', fakerArgs: [] },
            { fieldPath: 'b', fakerMethod: 'lorem.word', fakerArgs: [] },
          ],
        },
        {
          fields: [
            { fieldPath: 'c', fakerMethod: 'lorem.word', fakerArgs: [] },
          ],
        },
      ];
      const merged = mergeChunkResponses(responses);
      expect(merged.fields.map((f) => f.fieldPath)).to.deep.equal([
        'a',
        'b',
        'c',
      ]);
    });
  });

  describe('validateSchemaSize', function () {
    it('does not throw for schema within limits', function () {
      const schema = makeSchema(FIELDS_PER_CHUNK * MAX_CHUNKS);
      expect(() => validateSchemaSize(schema)).to.not.throw();
    });

    it('does not throw for empty schema', function () {
      expect(() => validateSchemaSize({})).to.not.throw();
    });

    it('throws for schema exceeding maximum fields', function () {
      const schema = makeSchema(FIELDS_PER_CHUNK * MAX_CHUNKS + 1);
      expect(() => validateSchemaSize(schema)).to.throw(
        `Schema too large: 301 fields exceeds maximum of 300 fields`
      );
    });
  });

  describe('needsBatching', function () {
    it('returns false for empty schema', function () {
      expect(needsBatching({})).to.be.false;
    });

    it('returns false when fields <= FIELDS_PER_CHUNK', function () {
      expect(needsBatching(makeSchema(FIELDS_PER_CHUNK))).to.be.false;
    });

    it('returns true when fields > FIELDS_PER_CHUNK', function () {
      expect(needsBatching(makeSchema(FIELDS_PER_CHUNK + 1))).to.be.true;
    });
  });
});
