declare module 'mongodb-ns' {
  export default function (ns: string): {
    database: string;
    collection: string;
  };
}
