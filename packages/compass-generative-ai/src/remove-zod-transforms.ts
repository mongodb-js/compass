import z from 'zod';

/**
 * Recursively remove Zod transforms from a Zod schema.
 * Handles Zod 4 schemas (with _zod.def.type) from mongodb-mcp-server and
 * reconstructs them using the local Zod instance so the result is always
 * a z.ZodTypeAny from this package.
 *
 * @param schema - The Zod schema to remove transforms from.
 * @returns The Zod schema without transforms (local z.ZodTypeAny).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function removeZodTransforms(schema: any): z.ZodTypeAny {
  const def = schema._zod?.def ?? schema._def;
  const type: string | undefined = def?.type;

  // Pipe where the output is a transform → unwrap to the input side
  if (type === 'pipe' && def.out?._zod?.def?.type === 'transform') {
    return removeZodTransforms(def.in);
  }

  // Object
  if (type === 'object') {
    const shape = def.shape;
    const newShape: Record<string, z.ZodTypeAny> = Object.create(null);
    for (const key in shape) {
      newShape[key] = removeZodTransforms(shape[key]);
    }
    return z.object(newShape);
  }

  // Array
  if (type === 'array') {
    return z.array(removeZodTransforms(def.element));
  }

  // Optional
  if (type === 'optional') {
    return removeZodTransforms(def.innerType).optional();
  }

  // Nullable
  if (type === 'nullable') {
    return removeZodTransforms(def.innerType).nullable();
  }

  // Default
  if (type === 'default') {
    return removeZodTransforms(def.innerType).default(def.defaultValue);
  }

  // Union
  if (type === 'union') {
    return z.union(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      def.options.map((o: any) => removeZodTransforms(o)) as [
        z.ZodTypeAny,
        z.ZodTypeAny,
        ...z.ZodTypeAny[]
      ]
    );
  }

  // Intersection
  if (type === 'intersection') {
    return z.intersection(
      removeZodTransforms(def.left),
      removeZodTransforms(def.right)
    );
  }

  // Tuple
  if (type === 'tuple') {
    return z.tuple(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      def.items.map((i: any) => removeZodTransforms(i)) as [
        z.ZodTypeAny,
        ...z.ZodTypeAny[]
      ]
    );
  }

  // Record
  if (type === 'record') {
    return z.record(
      removeZodTransforms(def.keyType),
      removeZodTransforms(def.valueType)
    );
  }

  // Map
  if (type === 'map') {
    return z.map(
      removeZodTransforms(def.keyType),
      removeZodTransforms(def.valueType)
    );
  }

  // Lazy
  if (type === 'lazy') {
    return z.lazy(() => removeZodTransforms(def.getter()));
  }

  // Promise
  if (type === 'promise') {
    return z.promise(removeZodTransforms(def.innerType));
  }

  // Primitives and other leaf types – reconstruct using local z so the
  // returned schema is from the same zod instance the caller uses.
  return reconstructPrimitive(schema);
}

/**
 * Reconstruct a primitive / leaf zod-4 schema using the local zod
 * instance so that the AI SDK receives types it understands.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reconstructPrimitive(schema: any): z.ZodTypeAny {
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
