import type { Document } from 'mongodb';
import type { PrimitiveSchemaType } from 'mongodb-schema';

export const SCHEMA_ANALYSIS_STATE_INITIAL = 'initial';
export const SCHEMA_ANALYSIS_STATE_ANALYZING = 'analyzing';
export const SCHEMA_ANALYSIS_STATE_COMPLETE = 'complete';
export const SCHEMA_ANALYSIS_STATE_ERROR = 'error';

export type SchemaAnalysisStatus =
  | typeof SCHEMA_ANALYSIS_STATE_INITIAL
  | typeof SCHEMA_ANALYSIS_STATE_ANALYZING
  | typeof SCHEMA_ANALYSIS_STATE_COMPLETE
  | typeof SCHEMA_ANALYSIS_STATE_ERROR;

export type SchemaAnalysisInitialState = {
  status: typeof SCHEMA_ANALYSIS_STATE_INITIAL;
};

export type SchemaAnalysisStartedState = {
  status: typeof SCHEMA_ANALYSIS_STATE_ANALYZING;
};

export type SchemaAnalysisError = {
  errorMessage: string;
  errorType: 'timeout' | 'highComplexity' | 'general';
};

export type SchemaAnalysisErrorState = {
  status: typeof SCHEMA_ANALYSIS_STATE_ERROR;
  error: SchemaAnalysisError;
};

/**
 * MongoDB schema type
 */
export type MongoDBFieldType = PrimitiveSchemaType['name'];

/**
 * Primitive values that can appear in sample_values after BSON-to-primitive conversion.
 * These are the JavaScript primitive equivalents of BSON values.
 */
export type SampleValue =
  | string // String, Symbol, ObjectId, Binary, RegExp, Code, etc. (converted to string)
  | number // Number, Int32, Long, Double, Decimal128, Timestamp (converted via valueOf())
  | boolean
  | Date
  | null
  | undefined;

/**
 * Schema field information (for LLM processing)
 */
export interface FieldInfo {
  type: MongoDBFieldType; // MongoDB primitive type
  sample_values?: SampleValue[]; // Primitive sample values (limited to 10)
  probability?: number; // 0.0 - 1.0 field frequency
}

export type SchemaAnalysisCompletedState = {
  status: typeof SCHEMA_ANALYSIS_STATE_COMPLETE;
  processedSchema: Record<string, FieldInfo>;
  sampleDocument: Document;
  schemaMetadata: {
    maxNestingDepth: number;
    validationRules: Document | null;
  };
};

export type SchemaAnalysisState =
  | SchemaAnalysisInitialState
  | SchemaAnalysisStartedState
  | SchemaAnalysisCompletedState
  | SchemaAnalysisErrorState;
