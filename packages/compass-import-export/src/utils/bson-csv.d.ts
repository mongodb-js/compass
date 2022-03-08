export interface SerializeOutput {
  [key: string]: string
}
declare namespace bsonCSV {
  const valueToString(value: any): string;
  function serialize(doc: Object): SerializeOutput 
}
