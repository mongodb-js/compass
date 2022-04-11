import type { TypeCastMap, TypeCastTypes } from 'hadron-type-checker';

export function fieldStringLen(value: unknown): number {
  const length = String(value).length;
  return length === 0 ? 1 : length;
}

export type BSONObject = TypeCastMap['Object'];
export type BSONArray = TypeCastMap['Array'];
export type BSONValue = TypeCastMap[TypeCastTypes];
