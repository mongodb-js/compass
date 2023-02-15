declare module 'decomment';
declare module 'react-sortable-hoc';
declare module '@mongodb-js/mongodb-redux-common/app-registry';
declare module 'mongodb-query-parser' {
  import type { CollationOptions } from 'mongodb';
  const isCollationValid: (
    collationString: string
  ) => false | null | CollationOptions;
  export { isCollationValid };
}
declare module '*.module.less' {
  const styles = Record<string, string>;
  export default styles;
}
