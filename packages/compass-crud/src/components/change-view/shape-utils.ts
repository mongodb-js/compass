export function isSimpleObject(value: any) {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !value._bsontype
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
