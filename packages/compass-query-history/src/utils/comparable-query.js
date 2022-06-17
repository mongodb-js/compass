function comparableQuery(item) {
  const query = {};
  for (const [k, v] of Object.entries(item.serialize())) {
    if (k.startsWith('_')) {
      continue;
    }
    query[k] = v;
  }
  return query;
}

export default comparableQuery;
export { comparableQuery };
