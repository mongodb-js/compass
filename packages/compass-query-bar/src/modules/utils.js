export function objectContainsRegularExpression(obj) {
  // This assumes that the input is not circular.
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  if (Object.prototype.toString.call(obj) === '[object RegExp]') {
    return true;
  }
  return Object.values(obj).some(objectContainsRegularExpression);
}
