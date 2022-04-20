const _ = require('lodash');

/**
 * extract longitudes and latitudes, run a bounds check and return zipped
 * coordinates or false, if the bounds check fails. Bounds are [-180, 180] for
 * longitude, [-90, 90] for latitude, boundaries included.
 *
 * @api private
 *
 * @param  {Array} values  a flattened array of coordinates: [lng, lat, lng, lat, ...]
 * @return {[type]}        returns a zipped array of [[lng, lat], [lng, lat], ...]
 *                         coordinates or false if bounds check fails.
 */
function _zipCoordinates(values) {
  const lons = _.filter(values, function (val, idx) {
    return idx % 2 === 0;
  });
  const lats = _.filter(values, function (val, idx) {
    return idx % 2 === 1;
  });
  if (
    _.min(lons) >= -180 &&
    _.max(lons) <= 180 &&
    _.min(lats) >= -90 &&
    _.max(lats) <= 90
  ) {
    return _.zip(lons, lats);
  }
  return false;
}

/**
 * detect legacy coordinate pairs.
 *
 * @api private
 *
 * @param  {Object} type        a mongodb-schema "Array" type
 * @return {Array|Boolean}      zipped coordinates or false.
 */
function _detectLegacyPairs(type) {
  // all arrays need to have exactly 2 values
  if (!type.lengths) {
    return false;
  }
  if (
    !_.every(type.lengths, function (length) {
      return length === 2;
    })
  ) {
    return false;
  }
  // make sure the array only contains numbers
  if (!type.types) {
    return false;
  }
  if (!_.isArray(type.types)) {
    return false;
  }
  if (type.types.length !== 1) {
    return false;
  }
  // support both promoted Number type and unpromoted Double, Decimal128 or Int32
  if (
    !_.includes(['Number', 'Double', 'Int32', 'Decimal128'], type.types[0].name)
  ) {
    return false;
  }
  return _zipCoordinates(type.types[0].values);
}

/**
 * detect GeoJSON documents.
 *
 * @api private
 *
 * @param  {Object} type        a mongodb-schema "Document" type
 * @return {Array|Boolean}      zipped coordinates or false.
 */
// eslint-disable-next-line complexity
function _detectGeoJSON(type) {
  // documents require at 2 children, `type` and `coordinates`
  if (!type.fields) {
    return false;
  }
  if (!_.isArray(type.fields)) {
    return false;
  }
  if (type.fields.length < 2) {
    return false;
  }

  const typeField = _.find(type.fields, ['name', 'type']);
  const coordinatesField = _.find(type.fields, ['name', 'coordinates']);

  if (!typeField || !coordinatesField) {
    return false;
  }

  // check that type has one type `String` and all values are "Point"
  if (!typeField.types) {
    return false;
  }
  if (!_.isArray(typeField.types)) {
    return false;
  }
  if (typeField.types.length !== 1) {
    return false;
  }
  if (typeField.types[0].name !== 'String') {
    return false;
  }
  if (
    !_.every(typeField.types[0].values, function (value) {
      return value === 'Point';
    })
  ) {
    return false;
  }
  // check that `coordinate` has one type `Array`
  if (!coordinatesField.types) {
    return false;
  }
  if (!_.isArray(coordinatesField.types)) {
    return false;
  }
  if (coordinatesField.types.length !== 1) {
    return false;
  }
  if (coordinatesField.types[0].name !== 'Array') {
    return false;
  }
  // coordinates array type must pass legacy coordinate pair check
  return _detectLegacyPairs(coordinatesField.types[0]);
}

/**
 * detects whether a mongodb-schema type object actually represents
 * geo coordinates, either as legacy coordinate pairs (2-element array
 * of long/lat coordinates) or a GeoJSON object.
 *
 * @api public
 *
 * @param {Object} type        a mongodb-schema type object (plain javascript)
 * @return {Array|Boolean}     returns array of zipped lng/lat coordinate pairs
 *                             if the type represents geo coordinates, else false.
 */
function detectGeoCoordinates(type) {
  if (type.name === 'Document') {
    return _detectGeoJSON(type);
  }
  if (type.name === 'Array') {
    return _detectLegacyPairs(type);
  }
  return false;
}

module.exports = detectGeoCoordinates;
