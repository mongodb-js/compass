declare module 'mongodb-query-parser' {
  const queryParser: any;
  export default queryParser;
}

declare module 'mongodb-query-util' {
  const queryUtil: any;
  const bsonEqual: any;
  const hasDistinctValue: any;
  export default queryUtil;
  export { bsonEqual, hasDistinctValue };
}
