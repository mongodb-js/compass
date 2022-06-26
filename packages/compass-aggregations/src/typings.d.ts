
declare module '@mongodb-js/mongodb-redux-common/app-registry';
declare module 'mongodb-ace-autocompleter';
declare module 'mongodb-query-parser' {
    import type { CollationOptions } from 'mongodb';
    const isCollationValid: (collationString: string) => false | null | CollationOptions;
    export { isCollationValid };
}
