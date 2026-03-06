import { getBsonType } from 'hadron-type-checker';

export function isSimpleObject(value: any) {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !getBsonType(value)
  );
}

export function getValueShape(value: any): 'array' | 'object' | 'leaf' {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (isSimpleObject(value)) {
    return 'object';
  }
  return 'leaf';
}
