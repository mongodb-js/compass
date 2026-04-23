import { expect } from 'chai';
import z from 'zod/v4';
import { removeZodTransforms } from './remove-zod-transforms';

describe('removeZodTransforms', function () {
  describe('primitives and basic types', function () {
    it('should return string schema as-is', function () {
      const schema = z.string();
      const result = removeZodTransforms(schema);
      expect(result).to.equal(schema);
    });

    it('should return number schema as-is', function () {
      const schema = z.number();
      const result = removeZodTransforms(schema);
      expect(result).to.equal(schema);
    });

    it('should return boolean schema as-is', function () {
      const schema = z.boolean();
      const result = removeZodTransforms(schema);
      expect(result).to.equal(schema);
    });

    it('should return literal schema as-is', function () {
      const schema = z.literal('hello');
      const result = removeZodTransforms(schema);
      expect(result).to.equal(schema);
    });

    it('should return enum schema as-is', function () {
      const schema = z.enum(['a', 'b', 'c']);
      const result = removeZodTransforms(schema);
      expect(result).to.equal(schema);
    });
  });

  describe('transforms', function () {
    it('should remove transform and return inner schema', function () {
      const schema = z.string().transform((s) => s.toUpperCase());
      const result = removeZodTransforms(schema);

      expect(result._zod.def.type).to.equal('string');
      expect(result.parse('test')).to.equal('test');
    });

    it('should remove preprocess and return inner schema', function () {
      const schema = z.preprocess((val) => String(val), z.string());
      const result = removeZodTransforms(schema);

      expect(result._zod.def.type).to.equal('string');
    });

    it('should handle nested transforms', function () {
      const schema = z
        .string()
        .transform((s) => s.toLowerCase())
        .transform((s) => s.trim())
        .transform((s) => s.toUpperCase());

      const result = removeZodTransforms(schema);

      expect(result._zod.def.type).to.equal('string');
      expect(result.parse('  TEST  ')).to.equal('  TEST  ');
    });
  });

  describe('ZodObject', function () {
    it('should process object properties', function () {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = removeZodTransforms(schema);
      expect(result._zod.def.type).to.equal('object');

      const parsed = result.parse({ name: 'John', age: 30 });
      expect(parsed).to.deep.equal({ name: 'John', age: 30 });
    });

    it('should remove transforms from nested object properties', function () {
      const schema = z.object({
        name: z.string().transform((s) => s.toUpperCase()),
        age: z.number(),
      });

      const result = removeZodTransforms(schema);
      const parsed = result.parse({ name: 'john', age: 30 });
      expect(parsed).to.deep.equal({ name: 'john', age: 30 });
    });

    it('should preserve loose/passthrough behavior', function () {
      const schema = z.object({ name: z.string() }).passthrough();

      const result = removeZodTransforms(schema);
      const parsed = result.parse({ name: 'John', extra: 'field' });
      expect(parsed).to.deep.equal({ name: 'John', extra: 'field' });
    });

    it('should handle catchall schemas', function () {
      const schema = z.object({ name: z.string() }).catchall(z.number());

      const result = removeZodTransforms(schema);
      const parsed = result.parse({ name: 'John', extra: 42 });
      expect(parsed).to.deep.equal({ name: 'John', extra: 42 });
    });

    it('should remove transforms from catchall schemas', function () {
      const schema = z
        .object({ name: z.string() })
        .catchall(z.number().transform((n) => n * 2));

      const result = removeZodTransforms(schema);
      const parsed = result.parse({ name: 'John', extra: 42 });
      expect(parsed).to.deep.equal({ name: 'John', extra: 42 });
    });
  });

  describe('ZodArray', function () {
    it('should handle array schemas', function () {
      const schema = z.array(z.string());
      const result = removeZodTransforms(schema);

      const parsed = result.parse(['a', 'b']);
      expect(parsed).to.deep.equal(['a', 'b']);
    });

    it('should remove transforms from array element schema', function () {
      const schema = z.array(z.string().transform((s) => s.toUpperCase()));
      const result = removeZodTransforms(schema);

      const parsed = result.parse(['hello']);
      expect(parsed).to.deep.equal(['hello']);
    });
  });

  describe('ZodOptional', function () {
    it('should handle optional schemas', function () {
      const schema = z.string().optional();
      const result = removeZodTransforms(schema);

      expect(result.parse(undefined)).to.equal(undefined);
      expect(result.parse('test')).to.equal('test');
    });

    it('should remove transforms from optional inner schema', function () {
      const schema = z
        .string()
        .transform((s) => s.toUpperCase())
        .optional();
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(undefined)).to.equal(undefined);
    });
  });

  describe('ZodNullable', function () {
    it('should handle nullable schemas', function () {
      const schema = z.string().nullable();
      const result = removeZodTransforms(schema);

      expect(result.parse(null)).to.equal(null);
      expect(result.parse('test')).to.equal('test');
    });

    it('should remove transforms from nullable inner schema', function () {
      const schema = z
        .string()
        .transform((s) => s.toUpperCase())
        .nullable();
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(null)).to.equal(null);
    });
  });

  describe('ZodDefault', function () {
    it('should preserve default values', function () {
      const schema = z.string().default('hello');
      const result = removeZodTransforms(schema);

      expect(result.parse(undefined)).to.equal('hello');
    });

    it('should remove transforms from default inner schema', function () {
      const schema = z
        .string()
        .transform((s) => s.toUpperCase())
        .default('hello');
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(undefined)).to.equal('hello');
    });
  });

  describe('ZodUnion', function () {
    it('should handle union schemas', function () {
      const schema = z.union([z.string(), z.number()]);
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(42)).to.equal(42);
    });

    it('should remove transforms from union options', function () {
      const schema = z.union([
        z.string().transform((s) => s.toUpperCase()),
        z.number().transform((n) => n * 2),
      ]);
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(42)).to.equal(42);
    });
  });

  describe('ZodTuple', function () {
    it('should handle tuple schemas', function () {
      const schema = z.tuple([z.string(), z.number()]);
      const result = removeZodTransforms(schema);

      const parsed = result.parse(['test', 42]);
      expect(parsed).to.deep.equal(['test', 42]);
    });

    it('should remove transforms from tuple items', function () {
      const schema = z.tuple([
        z.string().transform((s) => s.toUpperCase()),
        z.number().transform((n) => n * 2),
      ]);
      const result = removeZodTransforms(schema);

      const parsed = result.parse(['test', 42]);
      expect(parsed).to.deep.equal(['test', 42]);
    });
  });

  describe('ZodRecord', function () {
    it('should handle record schemas', function () {
      const schema = z.record(z.string(), z.number());
      const result = removeZodTransforms(schema);

      const parsed = result.parse({ a: 1, b: 2 });
      expect(parsed).to.deep.equal({ a: 1, b: 2 });
    });

    it('should remove transforms from record value type', function () {
      const schema = z.record(
        z.string(),
        z.number().transform((n) => n * 2)
      );
      const result = removeZodTransforms(schema);

      const parsed = result.parse({ a: 1 });
      expect(parsed).to.deep.equal({ a: 1 });
    });
  });

  describe('ZodLazy', function () {
    it('should handle lazy schemas', function () {
      const schema = z.lazy(() => z.string());
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
    });

    it('should remove transforms from lazy schema', function () {
      const schema = z.lazy(() => z.string().transform((s) => s.toUpperCase()));
      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
    });
  });

  describe('complex nested structures', function () {
    it('should handle deeply nested schemas with multiple transforms', function () {
      const schema = z.object({
        users: z.array(
          z.object({
            name: z.string().transform((s) => s.toUpperCase()),
            age: z.number().transform((n) => n * 2),
            tags: z.array(z.string().transform((s) => s.trim())).optional(),
          })
        ),
        metadata: z
          .object({
            count: z.number(),
          })
          .transform((m) => ({ ...m, processed: true })),
      });

      const result = removeZodTransforms(schema);

      const input = {
        users: [
          {
            name: 'john',
            age: 25,
            tags: ['  tag1  '],
          },
        ],
        metadata: { count: 1 },
      };

      const parsed = result.parse(input);
      expect(parsed.users[0].name).to.equal('john');
      expect(parsed.users[0].age).to.equal(25);
      expect(parsed.users[0].tags).to.deep.equal(['  tag1  ']);
      expect(parsed.metadata).to.deep.equal({ count: 1 });
    });

    it('should handle MCP-style zEJSON pattern', function () {
      // Simulates the actual MCP server pattern: z.object({}).loose().transform(toEJSON)
      const zEJSON = z
        .object({})
        .loose()
        .transform((v) => ({ ...v, deserialized: true }));

      const schema = z.object({
        database: z.string(),
        collection: z.string(),
        filter: zEJSON,
      });

      const result = removeZodTransforms(schema);

      const input = {
        database: 'test',
        collection: 'users',
        filter: { name: 'John', age: { $gt: 25 } },
      };

      const parsed = result.parse(input);
      expect(parsed.database).to.equal('test');
      expect(parsed.collection).to.equal('users');
      expect(parsed.filter).to.deep.equal({
        name: 'John',
        age: { $gt: 25 },
      });
      expect(parsed.filter).to.not.have.property('deserialized');
    });
  });
});
