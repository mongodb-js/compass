declare module 'mongodb-query-parser' {
  const stringify: (object: Record<string, unknown>) => string;
  export { stringify };
}
