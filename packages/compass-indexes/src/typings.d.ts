declare module 'mongodb-query-parser' {
  import type { CollationOptions } from 'mongodb';
  const isCollationValid: (
    collationString: string
  ) => false | null | CollationOptions;
  export { isCollationValid };
}

declare module 'hadron-react-components';
declare module 'hadron-app';
declare module '@mongodb-js/mongodb-redux-common/app-registry';
declare module 'lodash.contains';
declare module 'mongodb-index-model' {
  export type AmpersandIndexModel = Record<string, any>;
  export default any;
}
