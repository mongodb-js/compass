import type {
  ObjectId,
  MinKey,
  MaxKey,
  Long,
  Double,
  Int32,
  Decimal128,
  Binary,
  BSONRegExp,
  Code,
  BSONSymbol,
  Timestamp
} from 'bson';

export type TypeCastMap = {
  Array: unknown[];
  Binary: Binary;
  Boolean: boolean;
  Code: Code;
  Date: Date;
  Decimal128: Decimal128;
  Double: Double;
  Int32: Int32;
  Int64: Long;
  MaxKey: MaxKey;
  MinKey: MinKey;
  Null: null;
  Object: Record<string, unknown>;
  ObjectId: ObjectId;
  BSONRegExp: BSONRegExp;
  String: string;
  BSONSymbol: BSONSymbol;
  Timestamp: Timestamp;
  Undefined: undefined;
};

export type TypeCastTypes = keyof TypeCastMap;

declare class TypeChecker {
  cast<O = unknown, T extends string = string>(
    object: O,
    type: T
  ): T extends TypeCastTypes ? TypeCastMap[T] : O;
  type(object: unknown): TypeCastTypes;
  castableTypes(highPrecisionSupport?: boolean): TypeCastTypes[];
}

declare const typeCheckerInstance: TypeChecker;

export default typeCheckerInstance;
