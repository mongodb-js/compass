declare module 'mongodb-query-parser' {
  function validate(...args: any[]): unknown | false;
  function stringify(...args: any[]): string;
  function toJSString(input: unknown, pad?: string): string;
  const queryParser = { validate, stringify, toJSString };
  export { validate, stringify, toJSString };
  export default queryParser;
}

declare module 'mongodb-query-util' {
  const bsonEqual: any;
  const hasDistinctValue: any;
  const queryUtil: any;
  export { bsonEqual, hasDistinctValue };
  export default queryUtil;
}
