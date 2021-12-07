const PROPERTIES_COLLATION = 'collation';
const PROPERTIES_TIME_SERIES = 'timeseries';
const PROPERTIES_CAPPED = 'capped';
const PROPERTIES_VIEW = 'view';
const PROPERTIES_READ_ONLY = 'read-only';

function getProperties(coll) {
  const properties = [];

  if (coll.collation) {
    properties.push({
      name: PROPERTIES_COLLATION,
      options: coll.collation,
    });
  }

  if (coll.type === 'timeseries') {
    properties.push({
      name: PROPERTIES_TIME_SERIES,
    });
  }

  if (coll.type === 'view') {
    properties.push({
      name: PROPERTIES_VIEW,
    });
  }

  if (coll.capped) {
    properties.push({
      name: PROPERTIES_CAPPED,
    });
  }

  if (coll.readonly) {
    properties.push({
      name: PROPERTIES_READ_ONLY,
    });
  }

  return properties;
}

module.exports = { getProperties };
