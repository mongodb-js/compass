declare module 'mongodb-query-parser' {
  import type { CollationOptions } from 'mongodb';
  const isCollationValid: (
    collationString: string
  ) => false | null | CollationOptions;
  export { isCollationValid };
}

declare module '@mongodb-js/mongodb-redux-common/app-registry';
declare module 'lodash.contains';
declare module 'lodash.clonedeep';
declare module 'mongodb-index-model';
