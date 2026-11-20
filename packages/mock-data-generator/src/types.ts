import type { PrimitiveSchemaType } from '@mongodb-js/mongodb-schema';

/** A MongoDB primitive type name, as reported by schema analysis. */
export type MongoDBFieldType = PrimitiveSchemaType['name'];

/** Sentinel used when the LLM does not map a field to a known faker method. */
export const UNRECOGNIZED_FAKER_METHOD = 'Unrecognized';

export type FakerArg =
  string | number | boolean | { json: string } | FakerArg[];

// Stores the average array length of each array.
// Examples:
//   "users[]": 5 - users array has 5 elements
//   "users[].posts[]": 3 - each user has 3 posts
export type ArrayLengthMap = Record<string, number>;

export interface ScriptOptions {
  documentCount: number;
  databaseName: string;
  collectionName: string;
  arrayLengthMap?: ArrayLengthMap;
}

export interface FakerFieldMapping {
  mongoType: MongoDBFieldType;
  fakerMethod: string;
  fakerArgs: FakerArg[];
  probability?: number; // 0.0 - 1.0 frequency of field (defaults to 1.0)
}

export type FakerSchema = Record<string, FakerFieldMapping>;
