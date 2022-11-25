export const prepareMetrics = async (collection) => {
  if (!collection.options) {
    return {};
  }

  const collectionOptions = await collection.options();

  return {
    isCapped: !!collectionOptions.capped,
    hasCustomCollation: !!collectionOptions.collation,
    collectionType: collectionOptions.timeseries ? 'time-series' : 'collection',
  };
};
