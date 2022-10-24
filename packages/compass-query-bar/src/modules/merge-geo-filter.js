import { intersection, isPlainObject } from 'lodash';
import { QUERY_OPERATORS } from '@mongodb-js/mongodb-constants';

const GEOSPATIAL_QUERY_OPERATORS = QUERY_OPERATORS.filter(
  (op) => op.geospatial
).map((op) => op.value);

function isGeoCondition(value) {
  // Checking if value matches something like { $geoXXX: YYY }
  if (isPlainObject(value)) {
    return (
      intersection(Object.keys(value), GEOSPATIAL_QUERY_OPERATORS).length !== 0
    );
  }

  return false;
}

function containsGeoConditions(expression) {
  if (!isPlainObject(expression)) {
    return false;
  }

  // keys of object are the fields and values are the conditions
  return Object.values(expression).find(isGeoCondition) !== undefined;
}

function mergeGeoFilter(oldFilter, newGeoQueryFilter) {
  const filter = { ...oldFilter };

  // delete fields from the old filter which contain geo conditions
  for (const [key, value] of Object.entries(filter)) {
    if (isGeoCondition(value)) {
      delete filter[key];
    }
  }

  // delete expressions from the old $or operator which contain fields with geo conditions
  if (Array.isArray(filter.$or)) {
    filter.$or = filter.$or.filter(
      (expression) => !containsGeoConditions(expression)
    );

    // if at this point the $or is empty we just drop it
    if (!filter.$or.length) {
      delete filter.$or;
    }
  }

  // copy across all fields from the new filter which contain geo conditions
  for (const [key, value] of Object.entries(newGeoQueryFilter)) {
    if (isGeoCondition(value)) {
      filter[key] = value;
    }
  }

  // merge in expressions on the $or operator which contain fields with geo conditions
  if (newGeoQueryFilter.$or) {
    filter.$or = [
      ...(Array.isArray(filter.$or) ? filter.$or : []),
      ...newGeoQueryFilter.$or,
    ];
  }

  return filter;
}

export default mergeGeoFilter;
