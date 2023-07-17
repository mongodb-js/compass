declare module 'mongodb-query-parser' {
  function validate(...args: any[]): unknown | false;
  function stringify(...args: any[]): string;
  function toJSString(input: unknown, pad?: string): string;
  const queryParser = { validate, stringify, toJSString };
  export { validate, stringify, toJSString };
  export default queryParser;
}
