import z from 'zod/v4';

function isZodSchema(value: unknown): value is z.ZodType {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_zod' in value &&
    typeof (value as Record<string, unknown>)._zod === 'object' &&
    (value as Record<string, Record<string, unknown>>)._zod !== null &&
    'def' in (value as Record<string, Record<string, unknown>>)._zod
  );
}

/**
 * Recursively remove Zod transforms from a Zod schema.
 *
 * The AI SDK parses model responses through the inputSchema, which triggers
 * transforms (like the MCP server's toEJSON). We strip transforms so the AI
 * SDK receives plain JSON without BSON deserialization side-effects.
 */
export function removeZodTransforms(schema: unknown): z.ZodType {
  if (!isZodSchema(schema)) {
    throw new Error(
      `removeZodTransforms: expected a Zod v4 schema but received ${typeof schema}`
    );
  }

  // We access internal zod v4 def properties that aren't on the base type,
  // but are present at runtime after checking def.type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def: any = schema._zod.def;

  // ZodPipe — created by .transform(), .preprocess(), and .pipe()
  if (def.type === 'pipe') {
    const inDef = def.in._zod.def;
    const outDef = def.out._zod.def;

    if (outDef.type === 'transform') {
      // .transform(fn) → pipe { in: <original>, out: transform }
      return removeZodTransforms(def.in);
    }
    if (inDef.type === 'transform') {
      // .preprocess(fn, schema) → pipe { in: transform, out: <target> }
      return removeZodTransforms(def.out);
    }

    // Explicit .pipe(a, b) — recursively clean both sides
    const cleanIn = removeZodTransforms(def.in);
    const cleanOut = removeZodTransforms(def.out);
    return cleanIn.pipe(cleanOut);
  }

  // ZodObject — process each property
  if (def.type === 'object') {
    const shape = def.shape;
    const newShape: Record<string, z.ZodType> = Object.create(null);
    for (const key in shape) {
      newShape[key] = removeZodTransforms(shape[key]);
    }
    let result = z.object(newShape);
    if (def.catchall) {
      result = result.catchall(removeZodTransforms(def.catchall));
    }
    return result;
  }

  // ZodArray
  if (def.type === 'array') {
    return z.array(removeZodTransforms(def.element));
  }

  // ZodOptional
  if (def.type === 'optional') {
    return removeZodTransforms(def.innerType).optional();
  }

  // ZodNullable
  if (def.type === 'nullable') {
    return removeZodTransforms(def.innerType).nullable();
  }

  // ZodDefault
  if (def.type === 'default') {
    return removeZodTransforms(def.innerType).default(def.defaultValue);
  }

  // ZodUnion
  if (def.type === 'union') {
    return z.union(
      def.options.map(removeZodTransforms) as [
        z.ZodType,
        z.ZodType,
        ...z.ZodType[]
      ]
    );
  }

  // ZodTuple
  if (def.type === 'tuple') {
    return z.tuple(
      def.items.map(removeZodTransforms) as [z.ZodType, ...z.ZodType[]]
    );
  }

  // ZodRecord
  if (def.type === 'record') {
    return z.record(
      removeZodTransforms(def.keyType) as z.ZodString,
      removeZodTransforms(def.valueType)
    );
  }

  // ZodLazy
  if (def.type === 'lazy') {
    return z.lazy(() => removeZodTransforms(def.getter()));
  }

  // Primitives and other types — return as-is
  return schema;
}
