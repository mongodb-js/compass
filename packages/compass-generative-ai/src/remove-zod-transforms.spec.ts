import { expect } from 'chai';
import path from 'path';
import { removeZodTransforms } from './remove-zod-transforms';

// Load zod from mongodb-mcp-server's nested dependency – this is the same
// zod version that produces the schemas we receive at runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const z = require(path.join(
  __dirname,
  '../node_modules/mongodb-mcp-server/node_modules/zod'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
)) as any;

describe('removeZodTransforms', function () {
  describe('primitives and basic types', function () {
    it('should convert a string schema', function () {
      const schema = z.string();
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodString');
      expect(result.parse('hello')).to.equal('hello');
    });

    it('should convert a number schema', function () {
      const schema = z.number();
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodNumber');
      expect(result.parse(42)).to.equal(42);
    });

    it('should convert a boolean schema', function () {
      const schema = z.boolean();
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodBoolean');
      expect(result.parse(true)).to.equal(true);
    });

    it('should convert a literal schema', function () {
      const schema = z.literal('hello');
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodLiteral');
      expect(result.parse('hello')).to.equal('hello');
    });

    it('should convert an enum schema', function () {
      const schema = z.enum(['a', 'b', 'c']);
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodEnum');
      expect(result.parse('a')).to.equal('a');
    });

    it('should preserve descriptions', function () {
      const schema = z.string().describe('A user name');
      const result = removeZodTransforms(schema);

      expect(result.description).to.equal('A user name');
      expect(result.parse('test')).to.equal('test');
    });
  });

  describe('transforms', function () {
    it('should remove transform and return inner schema', function () {
      const schema = z.string().transform((s: string) => s.toUpperCase());
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodString');
      expect(result.parse('test')).to.equal('test');
    });

    it('should remove refine and return inner schema', function () {
      const schema = z.string().refine((s: string) => s.length > 5);
      const result = removeZodTransforms(schema);

      // refine in zod 4 doesn't create a pipe/transform, it stays a string
      expect(result._def.typeName).to.equal('ZodString');
      expect(result.parse('test')).to.equal('test');
    });

    it('should handle nested transforms', function () {
      const schema = z
        .string()
        .transform((s: string) => s.toLowerCase())
        .transform((s: string) => s.trim())
        .transform((s: string) => s.toUpperCase());

      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodString');
      expect(result.parse('  TEST  ')).to.equal('  TEST  ');
    });
  });

  describe('objects', function () {
    it('should process object properties', function () {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = removeZodTransforms(schema);
      expect(result._def.typeName).to.equal('ZodObject');

      const parsed = result.parse({ name: 'John', age: 30 });
      expect(parsed).to.deep.equal({ name: 'John', age: 30 });
    });

    it('should remove transforms from nested object properties', function () {
      const schema = z.object({
        name: z.string().transform((s: string) => s.toUpperCase()),
        age: z.number().transform((n: number) => n * 2),
      });

      const result = removeZodTransforms(schema);

      const parsed = result.parse({ name: 'john', age: 30 });
      expect(parsed).to.deep.equal({ name: 'john', age: 30 });
    });
  });

  describe('arrays', function () {
    it('should handle array schemas', function () {
      const schema = z.array(z.string());
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodArray');
      const parsed = result.parse(['a', 'b', 'c']);
      expect(parsed).to.deep.equal(['a', 'b', 'c']);
    });

    it('should remove transforms from array element schema', function () {
      const schema = z.array(
        z.string().transform((s: string) => s.toUpperCase())
      );
      const result = removeZodTransforms(schema);

      const parsed = result.parse(['a', 'b', 'c']);
      expect(parsed).to.deep.equal(['a', 'b', 'c']);
    });

    it('should handle nested arrays', function () {
      const schema = z.array(z.array(z.number()));
      const result = removeZodTransforms(schema);

      const parsed = result.parse([
        [1, 2],
        [3, 4],
      ]);
      expect(parsed).to.deep.equal([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('optional', function () {
    it('should handle optional schemas', function () {
      const schema = z.string().optional();
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodOptional');
      expect(result.parse('test')).to.equal('test');
      expect(result.parse(undefined)).to.equal(undefined);
    });

    it('should remove transforms from optional inner schema', function () {
      const schema = z
        .string()
        .transform((s: string) => s.toUpperCase())
        .optional();

      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(undefined)).to.equal(undefined);
    });
  });

  describe('nullable', function () {
    it('should handle nullable schemas', function () {
      const schema = z.string().nullable();
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodNullable');
      expect(result.parse('test')).to.equal('test');
      expect(result.parse(null)).to.equal(null);
    });

    it('should remove transforms from nullable inner schema', function () {
      const schema = z
        .string()
        .transform((s: string) => s.toUpperCase())
        .nullable();

      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(null)).to.equal(null);
    });
  });

  describe('default', function () {
    it('should preserve default values', function () {
      const schema = z.string().default('hello');
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodDefault');
      expect(result.parse(undefined)).to.equal('hello');
      expect(result.parse('world')).to.equal('world');
    });

    it('should remove transforms from default inner schema', function () {
      const schema = z
        .string()
        .transform((s: string) => s.toUpperCase())
        .default('hello');

      const result = removeZodTransforms(schema);

      expect(result.parse(undefined)).to.equal('hello');
      expect(result.parse('test')).to.equal('test');
    });
  });

  describe('unions', function () {
    it('should handle union schemas', function () {
      const schema = z.union([z.string(), z.number()]);
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodUnion');
      expect(result.parse('test')).to.equal('test');
      expect(result.parse(123)).to.equal(123);
    });

    it('should remove transforms from union options', function () {
      const schema = z.union([
        z.string().transform((s: string) => s.toUpperCase()),
        z.number().transform((n: number) => n * 2),
      ]);

      const result = removeZodTransforms(schema);

      expect(result.parse('test')).to.equal('test');
      expect(result.parse(123)).to.equal(123);
    });

    it('should handle discriminated unions', function () {
      const schema = z.union([
        z.object({ type: z.literal('a'), value: z.string() }),
        z.object({ type: z.literal('b'), value: z.number() }),
      ]);

      const result = removeZodTransforms(schema);

      const parsed1 = result.parse({ type: 'a', value: 'test' });
      expect(parsed1).to.deep.equal({ type: 'a', value: 'test' });

      const parsed2 = result.parse({ type: 'b', value: 123 });
      expect(parsed2).to.deep.equal({ type: 'b', value: 123 });
    });
  });

  describe('intersections', function () {
    it('should handle intersection schemas', function () {
      const schema = z.intersection(
        z.object({ name: z.string() }),
        z.object({ age: z.number() })
      );

      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodIntersection');
      const parsed = result.parse({ name: 'John', age: 30 });
      expect(parsed).to.deep.equal({ name: 'John', age: 30 });
    });

    it('should remove transforms from intersection parts', function () {
      const schema = z.intersection(
        z.object({
          name: z.string().transform((s: string) => s.toUpperCase()),
        }),
        z.object({ age: z.number().transform((n: number) => n * 2) })
      );

      const result = removeZodTransforms(schema);

      const parsed = result.parse({ name: 'john', age: 30 });
      expect(parsed).to.deep.equal({ name: 'john', age: 30 });
    });
  });

  describe('tuples', function () {
    it('should handle tuple schemas', function () {
      const schema = z.tuple([z.string(), z.number(), z.boolean()]);
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodTuple');
      const parsed = result.parse(['test', 123, true]);
      expect(parsed).to.deep.equal(['test', 123, true]);
    });

    it('should remove transforms from tuple items', function () {
      const schema = z.tuple([
        z.string().transform((s: string) => s.toUpperCase()),
        z.number().transform((n: number) => n * 2),
      ]);

      const result = removeZodTransforms(schema);

      const parsed = result.parse(['test', 123]);
      expect(parsed).to.deep.equal(['test', 123]);
    });
  });

  describe('records', function () {
    it('should handle record schemas', function () {
      const schema = z.record(z.string(), z.number());
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodRecord');
      const parsed = result.parse({ a: 1, b: 2 });
      expect(parsed).to.deep.equal({ a: 1, b: 2 });
    });

    it('should remove transforms from record key and value types', function () {
      const schema = z.record(
        z.string().transform((s: string) => s.toUpperCase()),
        z.number().transform((n: number) => n * 2)
      );

      const result = removeZodTransforms(schema);

      const parsed = result.parse({ a: 1, b: 2 });
      expect(parsed).to.deep.equal({ a: 1, b: 2 });
    });
  });

  describe('maps', function () {
    it('should handle map schemas', function () {
      const schema = z.map(z.string(), z.number());
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodMap');
      const testMap = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const parsed = result.parse(testMap);
      expect(parsed).to.deep.equal(testMap);
    });

    it('should remove transforms from map key and value types', function () {
      const schema = z.map(
        z.string().transform((s: string) => s.toUpperCase()),
        z.number().transform((n: number) => n * 2)
      );

      const result = removeZodTransforms(schema);

      const testMap = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const parsed = result.parse(testMap);
      expect(parsed).to.deep.equal(testMap);
    });
  });

  describe('lazy', function () {
    it('should handle lazy schemas', function () {
      const nodeSchema: unknown = z.lazy(() =>
        z.object({
          value: z.string(),
          children: z.array(nodeSchema).optional(),
        })
      );

      const result = removeZodTransforms(nodeSchema);

      expect(result._def.typeName).to.equal('ZodLazy');
      const parsed = result.parse({
        value: 'root',
        children: [
          { value: 'child1' },
          { value: 'child2', children: [{ value: 'grandchild' }] },
        ],
      });
      expect(parsed.value).to.equal('root');
      expect(parsed.children).to.have.lengthOf(2);
    });

    it('should remove transforms from lazy schema', function () {
      const schema = z.lazy(() =>
        z.string().transform((s: string) => s.toUpperCase())
      );
      const result = removeZodTransforms(schema);

      const parsed = result.parse('test');
      expect(parsed).to.equal('test');
    });
  });

  describe('promise', function () {
    it('should handle promise schemas', function () {
      const schema = z.promise(z.string());
      const result = removeZodTransforms(schema);

      expect(result._def.typeName).to.equal('ZodPromise');
    });

    it('should remove transforms from promise inner type', async function () {
      const schema = z.promise(
        z.string().transform((s: string) => s.toUpperCase())
      );
      const result = removeZodTransforms(schema);

      const parsed = await result.parse(Promise.resolve('test'));
      expect(parsed).to.equal('test');
    });
  });

  describe('complex nested structures', function () {
    it('should handle deeply nested schemas with multiple transforms', function () {
      const schema = z.object({
        users: z.array(
          z.object({
            name: z.string().transform((s: string) => s.toUpperCase()),
            email: z.string().transform((s: string) => s.toLowerCase()),
            age: z
              .number()
              .transform((n: number) => n * 2)
              .optional(),
            tags: z.array(z.string().transform((s: string) => s.trim())),
          })
        ),
        metadata: z.object({
          version: z.number(),
          timestamp: z.string(),
        }),
      });

      const result = removeZodTransforms(schema);

      const input = {
        users: [
          {
            name: 'john',
            email: 'JOHN@EXAMPLE.COM',
            age: 15,
            tags: ['  tag1  ', '  tag2  '],
          },
        ],
        metadata: {
          version: 1,
          timestamp: '2023-01-01',
        },
      };

      const parsed = result.parse(input);

      // Verify transforms were removed (values should be unchanged)
      expect(parsed.users[0].name).to.equal('john');
      expect(parsed.users[0].email).to.equal('JOHN@EXAMPLE.COM');
      expect(parsed.users[0].age).to.equal(15);
      expect(parsed.users[0].tags).to.deep.equal(['  tag1  ', '  tag2  ']);
    });

    it('should handle union of transformed objects', function () {
      const schema = z.union([
        z.object({
          type: z.literal('text'),
          value: z.string().transform((s: string) => s.toUpperCase()),
        }),
        z.object({
          type: z.literal('number'),
          value: z.number().transform((n: number) => n * 2),
        }),
      ]);

      const result = removeZodTransforms(schema);

      const parsed1 = result.parse({ type: 'text', value: 'hello' });
      expect(parsed1).to.deep.equal({ type: 'text', value: 'hello' });

      const parsed2 = result.parse({ type: 'number', value: 10 });
      expect(parsed2).to.deep.equal({ type: 'number', value: 10 });
    });
  });
});
