function comparableQuery(item: { serialize: () => Record<string, any> }) {
  const query: Record<string, any> = {};
  for (const [k, v] of Object.entries(item.serialize())) {
    if (k.startsWith('_')) {
      continue;
    }
    query[k] = v;
  }
  return query;
}

export { comparableQuery };
