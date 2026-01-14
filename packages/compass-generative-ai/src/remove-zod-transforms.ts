import z from 'zod';

/** Recursively remove Zod transforms from a Zod schema. */
/**
 * @param schema - The Zod schema to remove transforms from.
 * @returns The Zod schema without transforms.
 */
export function removeZodTransforms(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = schema._def;

  // ZodEffects (transform, refine, preprocess) - unwrap and continue
  if ('schema' in def && 'effect' in def) {
    return removeZodTransforms(def.schema);
  }

  // ZodObject - process each property
  if ('shape' in def && typeof def.shape === 'function') {
    const shape = def.shape();
    const newShape: Record<string, z.ZodTypeAny> = Object.create(null);
    for (const key in shape) {
      newShape[key] = removeZodTransforms(shape[key]);
    }
    let result = z.object(newShape);
    if (def.unknownKeys === 'passthrough') {
      result = result.passthrough() as any;
    } else if (def.unknownKeys === 'strip') {
      result = result.strip();
    }
    if (def.catchall && def.catchall._def.typeName !== 'ZodNever') {
      result = result.catchall(removeZodTransforms(def.catchall));
    }
    return result;
  }

  // ZodArray
  if ('type' in def && def.typeName === 'ZodArray') {
    return z.array(removeZodTransforms(def.type));
  }

  // ZodOptional
  if ('innerType' in def && def.typeName === 'ZodOptional') {
    return removeZodTransforms(def.innerType).optional();
  }

  // ZodNullable
  if ('innerType' in def && def.typeName === 'ZodNullable') {
    return removeZodTransforms(def.innerType).nullable();
  }

  // ZodDefault
  if ('innerType' in def && def.typeName === 'ZodDefault') {
    return removeZodTransforms(def.innerType).default(def.defaultValue());
  }

  // ZodUnion
  if ('options' in def && def.typeName === 'ZodUnion') {
    return z.union(
      def.options.map(removeZodTransforms) as [
        z.ZodTypeAny,
        z.ZodTypeAny,
        ...z.ZodTypeAny[]
      ]
    );
  }

  // ZodIntersection
  if ('left' in def && 'right' in def) {
    return z.intersection(
      removeZodTransforms(def.left),
      removeZodTransforms(def.right)
    );
  }

  // ZodTuple
  if ('items' in def && def.typeName === 'ZodTuple') {
    return z.tuple(
      def.items.map(removeZodTransforms) as [z.ZodTypeAny, ...z.ZodTypeAny[]]
    );
  }

  // ZodRecord
  if ('keyType' in def && 'valueType' in def && def.typeName === 'ZodRecord') {
    return z.record(
      removeZodTransforms(def.keyType),
      removeZodTransforms(def.valueType)
    );
  }

  // ZodMap
  if ('keyType' in def && 'valueType' in def && def.typeName === 'ZodMap') {
    return z.map(
      removeZodTransforms(def.keyType),
      removeZodTransforms(def.valueType)
    );
  }

  // ZodLazy
  if ('getter' in def && def.typeName === 'ZodLazy') {
    return z.lazy(() => removeZodTransforms(def.getter()));
  }

  // ZodPromise
  if ('type' in def && def.typeName === 'ZodPromise') {
    return z.promise(removeZodTransforms(def.type));
  }

  // Primitives and other types - return as-is
  return schema;
}
