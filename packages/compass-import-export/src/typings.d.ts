declare module 'mongodb-query-parser' {
  const stringify: (object: Record<string, unknown>) => string;
  export { stringify };
}

declare module '*.module.less' {
  const styles = Record<string, string>;
  export default styles;
}
