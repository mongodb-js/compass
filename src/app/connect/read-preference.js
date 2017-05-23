const ReadPreferenceOptionCollection = require('./models/read-preference-option-collection');

const PRIMARY = {
  _id: 'primary',
  title: 'Primary',
  description: 'Read only from primary member',
  enabled: true
};

const PRIMARY_PREFERRED = {
  _id: 'primaryPreferred',
  title: 'Primary Preferred',
  description: 'Read from primary member if available, otherwise secondary.',
  enabled: true
};

const SECONDARY = {
  _id: 'secondary',
  title: 'Secondary',
  description: 'Read only from secondary member',
  enabled: true
};

const SECONDARY_PREFERRED = {
  _id: 'secondaryPreferred',
  title: 'Secondary Preferred',
  description: 'Read from secondary member if available, otherwise primary.',
  enabled: true
};

const NEAREST = {
  _id: 'nearest',
  title: 'Nearest',
  description: 'Read from the server with the lowest latency',
  enabled: true
};

module.exports = new ReadPreferenceOptionCollection([
  PRIMARY,
  PRIMARY_PREFERRED,
  SECONDARY,
  SECONDARY_PREFERRED,
  NEAREST
]);
