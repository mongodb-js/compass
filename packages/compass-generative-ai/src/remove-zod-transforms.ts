import z from 'zod';

/**
 * Recursively remove Zod transforms from a Zod schema.
 * Supports both Zod 3 schemas (with _def.typeName) and Zod 4 schemas (with _def.type).
 * Zod 4 schemas are reconstructed using the local Zod 3 instance so the result
 * is always a z.ZodTypeAny from the local package.
 *
 * @param schema - The Zod schema to remove transforms from.
 * @returns The Zod schema without transforms (local z.ZodTypeAny).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeZodTransforms(schema: any): z.ZodTypeAny {
  const def = schema._def;

  if (def?.typeName) {
    // Zod 3 path (has typeName like "ZodString", "ZodObject", etc.)
    return removeZodTransformsV3(schema as z.ZodTypeAny);
  }

  // Zod 4 path (has def.type like "string", "object", etc.)
  return removeZodTransformsV4(schema);
}

// ---------------------------------------------------------------------------
// Zod 4 path – schemas from mongodb-mcp-server's zod ^4.0.0
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeZodTransformsV4(schema: any): z.ZodTypeAny {
  const def = schema._zod?.def ?? schema._def;
  const type: string | undefined = def?.type;

  // Pipe where the output is a transform → unwrap to the input side
  if (type === 'pipe' && def.out?._zod?.def?.type === 'transform') {
    return removeZodTransformsV4(def.in);
  }

  // Object
  if (type === 'object') {
    const shape = def.shape;
    const newShape: Record<string, z.ZodTypeAny> = Object.create(null);
    for (const key in shape) {
      newShape[key] = removeZodTransformsV4(shape[key]);
    }
    return z.object(newShape);
  }

  // Array
  if (type === 'array') {
    return z.array(removeZodTransformsV4(def.element));
  }

  // Optional
  if (type === 'optional') {
    return removeZodTransformsV4(def.innerType).optional();
  }

  // Nullable
  if (type === 'nullable') {
    return removeZodTransformsV4(def.innerType).nullable();
  }

  // Default
  if (type === 'default') {
    return removeZodTransformsV4(def.innerType).default(def.defaultValue);
  }

  // Union
  if (type === 'union') {
    return z.union(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      def.options.map((o: any) => removeZodTransformsV4(o)) as [
        z.ZodTypeAny,
        z.ZodTypeAny,
        ...z.ZodTypeAny[]
      ]
    );
  }

  // Intersection
  if (type === 'intersection') {
    return z.intersection(
      removeZodTransformsV4(def.left),
      removeZodTransformsV4(def.right)
    );
  }

  // Tuple
  if (type === 'tuple') {
    return z.tuple(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      def.items.map((i: any) => removeZodTransformsV4(i)) as [
        z.ZodTypeAny,
        ...z.ZodTypeAny[]
      ]
    );
  }

  // Record
  if (type === 'record') {
    return z.record(
      removeZodTransformsV4(def.keyType),
      removeZodTransformsV4(def.valueType)
    );
  }

  // Map
  if (type === 'map') {
    return z.map(
      removeZodTransformsV4(def.keyType),
      removeZodTransformsV4(def.valueType)
    );
  }

  // Lazy
  if (type === 'lazy') {
    return z.lazy(() => removeZodTransformsV4(def.getter()));
  }

  // Promise
  if (type === 'promise') {
    return z.promise(removeZodTransformsV4(def.innerType));
  }

  // Primitives and other leaf types – reconstruct using local z so the
  // returned schema is from the same zod instance the caller uses.
  return reconstructPrimitiveV4(schema);
}

/**
 * Reconstruct a primitive / leaf zod-4 schema using the local zod 3
 * instance so that the AI SDK receives types it understands.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reconstructPrimitiveV4(schema: any): z.ZodTypeAny {
  const def = schema._zod?.def ?? schema._def;
  const type: string | undefined = def?.type;
  const description: string | undefined = schema.description;

  let result: z.ZodTypeAny;

  switch (type) {
    case 'string':
      result = z.string();
      break;
    case 'number':
      result = z.number();
      break;
    case 'boolean':
      result = z.boolean();
      break;
    case 'literal':
      result = z.literal(def.values?.[0]);
      break;
    case 'enum':
      result = z.enum(
        Object.keys(def.entries as Record<string, string>) as [
          string,
          ...string[]
        ]
      );
      break;
    case 'never':
      result = z.never();
      break;
    case 'any':
      result = z.any();
      break;
    case 'unknown':
      result = z.unknown();
      break;
    case 'void':
      result = z.void();
      break;
    case 'null':
      result = z.null();
      break;
    case 'undefined':
      result = z.undefined();
      break;
    default:
      // Unknown type – fall back to z.any() so we don't crash
      result = z.any();
      break;
  }

  if (description) {
    result = result.describe(description);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Zod 3 path – kept for backward compatibility (tests, etc.)
// ---------------------------------------------------------------------------

function removeZodTransformsV3(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = schema._def;

  // ZodEffects (transform, refine, preprocess) - unwrap and continue
  if ('schema' in def && 'effect' in def) {
    return removeZodTransformsV3(def.schema);
  }

  // ZodObject - process each property
  if ('shape' in def && typeof def.shape === 'function') {
    const shape = def.shape();
    const newShape: Record<string, z.ZodTypeAny> = Object.create(null);
    for (const key in shape) {
      newShape[key] = removeZodTransformsV3(shape[key]);
    }
    let result = z.object(newShape);
    if (def.unknownKeys === 'passthrough') {
      result = result.passthrough() as any;
    } else if (def.unknownKeys === 'strip') {
      result = result.strip();
    }
    if (def.catchall && def.catchall._def.typeName !== 'ZodNever') {
      result = result.catchall(removeZodTransformsV3(def.catchall));
    }
    return result;
  }

  // ZodArray
  if ('type' in def && def.typeName === 'ZodArray') {
    return z.array(removeZodTransformsV3(def.type));
  }

  // ZodOptional
  if ('innerType' in def && def.typeName === 'ZodOptional') {
    return removeZodTransformsV3(def.innerType).optional();
  }

  // ZodNullable
  if ('innerType' in def && def.typeName === 'ZodNullable') {
    return removeZodTransformsV3(def.innerType).nullable();
  }

  // ZodDefault
  if ('innerType' in def && def.typeName === 'ZodDefault') {
    return removeZodTransformsV3(def.innerType).default(def.defaultValue());
  }

  // ZodUnion
  if ('options' in def && def.typeName === 'ZodUnion') {
    return z.union(
      def.options.map(removeZodTransformsV3) as [
        z.ZodTypeAny,
        z.ZodTypeAny,
        ...z.ZodTypeAny[]
      ]
    );
  }

  // ZodIntersection
  if ('left' in def && 'right' in def) {
    return z.intersection(
      removeZodTransformsV3(def.left),
      removeZodTransformsV3(def.right)
    );
  }

  // ZodTuple
  if ('items' in def && def.typeName === 'ZodTuple') {
    return z.tuple(
      def.items.map(removeZodTransformsV3) as [z.ZodTypeAny, ...z.ZodTypeAny[]]
    );
  }

  // ZodRecord
  if ('keyType' in def && 'valueType' in def && def.typeName === 'ZodRecord') {
    return z.record(
      removeZodTransformsV3(def.keyType),
      removeZodTransformsV3(def.valueType)
    );
  }

  // ZodMap
  if ('keyType' in def && 'valueType' in def && def.typeName === 'ZodMap') {
    return z.map(
      removeZodTransformsV3(def.keyType),
      removeZodTransformsV3(def.valueType)
    );
  }

  // ZodLazy
  if ('getter' in def && def.typeName === 'ZodLazy') {
    return z.lazy(() => removeZodTransformsV3(def.getter()));
  }

  // ZodPromise
  if ('type' in def && def.typeName === 'ZodPromise') {
    return z.promise(removeZodTransformsV3(def.type));
  }

  // Primitives and other types - return as-is
  return schema;
}
