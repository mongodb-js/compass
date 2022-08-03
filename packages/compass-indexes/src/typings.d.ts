declare module 'mongodb-query-parser' {
  import type { CollationOptions } from 'mongodb';
  const isCollationValid: (
    collationString: string
  ) => false | null | CollationOptions;
  export { isCollationValid };
}
