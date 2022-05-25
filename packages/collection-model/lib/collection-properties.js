const PROPERTIES_COLLATION = 'collation';
const PROPERTIES_TIME_SERIES = 'timeseries';
const PROPERTIES_CAPPED = 'capped';
const PROPERTIES_CLUSTERED = 'clustered';
const PROPERTIES_FLE2 = 'fle2';
const PROPERTIES_VIEW = 'view';
const PROPERTIES_READ_ONLY = 'read-only';

function getProperties(coll) {
  const properties = [];

  if (coll.collation) {
    properties.push({
      id: PROPERTIES_COLLATION,
      options: coll.collation,
    });
  }

  if (coll.type === 'timeseries') {
    properties.push({
      id: PROPERTIES_TIME_SERIES,
    });
  }

  if (coll.type === 'view') {
    properties.push({
      id: PROPERTIES_VIEW,
    });
  }

  if (coll.capped) {
    properties.push({
      id: PROPERTIES_CAPPED,
    });
  }

  if (coll.clustered) {
    properties.push({
      id: PROPERTIES_CLUSTERED,
    });
  }

  if (coll.readonly) {
    properties.push({
      id: PROPERTIES_READ_ONLY,
    });
  }

  if (coll.fle2) {
    properties.push({
      id: PROPERTIES_FLE2,
    });
  }

  return properties;
}

module.exports = { getProperties };
