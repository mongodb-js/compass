declare module 'mongodb-ns' {
  class NS {
    ns: string;
    dotIndex: number;
    database: string;
    collection: string;
    system: boolean;
    isSystem: boolean;
    oplog: boolean;
    isOplog: boolean;
    command: boolean;
    isCommand: boolean;
    special: boolean;
    isSpecial: boolean;
    specialish: boolean;
    normal: boolean;
    isNormal: boolean;
    validDatabaseName: boolean;
    validCollectionName: boolean;
    databaseHash: number;
    static sort(namespaces: string[]): typeof namespaces;
    // Assigned in the constructor, but will always be undefined
    // isConf: undefined;
  }

  declare const toNS: ((namespace: string) => NS) & { sort: typeof NS['sort'] };

  export default toNS;
}
