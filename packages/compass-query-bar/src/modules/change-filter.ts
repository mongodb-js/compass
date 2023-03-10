import {
  clone,
  get,
  has,
  includes,
  isArray,
  isEqualWith,
  isPlainObject,
  pull,
} from 'lodash';
import { bsonEqual, hasDistinctValue } from 'mongodb-query-util';
import mergeGeoFilter from './merge-geo-filter';

type ClearValueArgs = {
  /**
   * the field of the query to set the value on.
   */
  field: string;
};

type SetRangeValueArgs = {
  /**
   * the field of the query to set the value on.
   */
  field: string;
  /**
   * (optional) the minimum value (lower bound)
   */
  min?: unknown;
  /**
   * (optional) boolean, true uses $gte, false uses $gt. Default is true.
   */
  minInclusive?: boolean;
  /**
   * (optional) the maximum value (upper bound)
   */
  max?: unknown;
  /**
   * (optional) boolean, true uses $lte, false uses $lt. Default is false.
   */
  maxInclusive?: boolean;
  /**
   * (optional) boolean, unsets the value if an identical value is already set.
   * This is useful for the toggle behavior we use on minichart bars.
   */
  unsetIfSet?: boolean;
};

type GeoQuery = unknown;

type MergeGeoQueryArgs = GeoQuery;

type SetGeoWithinValueArgs = {
  /**
   * the field of the query to set the value on.
   */
  field: string;
  /**
   * array of two numeric values: longitude and latitude
   */
  center: [number, number];
  /**
   * radius in miles of the circle
   */
  radius: number;
};

type SetValueArgs = {
  /**
   * the field of the query to set the value on.
   */
  field: string;
  /**
   * the value to set.
   */
  value: unknown;
  /**
   * (optional) boolean, unsets the value if an identical value is already
   * set. This is useful for the toggle behavior we use on minichart bars.
   */
  unsetIfSet?: boolean;
};

type SetDistinctValueArgs = {
  /**
   * the field of the query to set the value on.
   */
  field: string;
  /**
   * the value(s) to set. Can be a single value or an array of values, in
   * which case `$in` is used.
   */
  value: unknown;
};

type ToggleDistinctValueArgs = {
  field: string;
  value: unknown;
};

/**
 * clears a field from the filter
 */
export function clearValue(input: unknown, args: ClearValueArgs): unknown {
  const result = clone(input) as any;
  delete result[args.field];
  return result;
}

/**
 * Sets the value for the given field on the filter.
 */
export function setValue(input: unknown, args: SetValueArgs): unknown {
  const filter = clone(input) as any;
  if (
    args.unsetIfSet &&
    isEqualWith(filter[args.field], args.value, bsonEqual)
  ) {
    delete filter[args.field];
  } else {
    filter[args.field] = args.value;
  }
  return filter;
}

/**
 * Takes either a single value or an array of values, and sets the value on the
 * filter correctly as equality or $in depending on the number of values.
 */
export function setDistinctValues(
  input: unknown,
  args: SetDistinctValueArgs
): unknown {
  let filter = clone(input) as any;
  if (isArray(args.value)) {
    if (args.value.length > 1) {
      filter[args.field] = { $in: args.value };
    } else if (args.value.length === 1) {
      filter[args.field] = args.value[0];
    } else {
      filter = clearValue(filter, { field: args.field });
    }
    return filter;
  }
  filter[args.field] = args.value;
  return filter;
}

/**
 * Adds a discrete value to a field on the filter, converting primitive
 * values to $in lists as required.
 */
export function addDistinctValue(
  input: unknown,
  args: ToggleDistinctValueArgs
): unknown {
  const filter = clone(input) as any;
  const field = get(filter, args.field, undefined);

  // field not present in filter yet, add primitive value
  if (field === undefined) {
    filter[args.field] = args.value;
    return filter;
  }
  // field is object, could be a $in clause or a primitive value
  if (isPlainObject(field)) {
    if (has(field, '$in')) {
      // add value to $in array if it is not present yet
      const inArray = filter[args.field].$in;
      if (!includes(inArray, args.value)) {
        filter[args.field].$in.push(args.value);
      }
      return filter;
    }
    // it is not a $in operator, replace the value
    filter[args.field] = args.value;
    return filter;
  }
  // in all other cases, we want to turn a primitive value into a $in list
  filter[args.field] = { $in: [field, args.value] };
  return filter;
}

/**
 * removes a distinct value from a field on the filter, converting primitive
 * values to $in lists as required.
 */
export function removeDistinctValue(
  input: unknown,
  args: ToggleDistinctValueArgs
): unknown {
  const filter = clone(input) as any;
  const field = get(filter, args.field, undefined);

  if (field === undefined) {
    return;
  }

  if (isPlainObject(field)) {
    if (has(field, '$in')) {
      // add value to $in array if it is not present yet
      const inArray = filter[args.field].$in;
      const newArray = pull(inArray, args.value);
      // if $in array was reduced to single value, replace with primitive
      if (newArray.length > 1) {
        filter[args.field].$in = newArray;
      } else if (newArray.length === 1) {
        filter[args.field] = newArray[0];
      } else {
        delete filter[args.field];
      }
      return filter;
    }
  }
  // if value to remove is the same as the primitive value, unset field
  if (isEqualWith(field, args.value, bsonEqual)) {
    delete filter[args.field];
    return filter;
  }
  // else do nothing
  return filter;
}

/**
 * adds distinct value (equality or $in) from filter if not yet present,
 * otherwise removes it.
 */
export function toggleDistinctValue(
  input: unknown,
  args: ToggleDistinctValueArgs
): unknown {
  const field = get(input, args.field, undefined);
  const modFn = hasDistinctValue(field, args.value)
    ? removeDistinctValue
    : addDistinctValue;
  return modFn(input, args);
}

/**
 * Sets a range with minimum and/or maximum, and determines inclusive/exclusive
 * upper and lower bounds. If neither `min` nor `max` are set, clears the field
 * on the filter.
 */
export function setRangeValues(
  input: unknown,
  args: SetRangeValueArgs
): unknown {
  let filter = clone(input) as any;
  const value: any = {};
  let op;
  // without min and max, clear the field
  const minValue = get(args, 'min', undefined);
  const maxValue = get(args, 'max', undefined);
  if (minValue === undefined && maxValue === undefined) {
    filter = clearValue(filter, { field: args.field });
    return filter;
  }

  if (minValue !== undefined) {
    op = get(args, 'minInclusive', true) ? '$gte' : '$gt';
    value[op] = minValue;
  }

  if (maxValue !== undefined) {
    op = get(args, 'maxInclusive', false) ? '$lte' : '$lt';
    value[op] = maxValue;
  }

  // if `args.unsetIfSet` is true, then unset the value if it's already set
  if (args.unsetIfSet && isEqualWith(filter[args.field], value, bsonEqual)) {
    delete filter[args.field];
  } else {
    filter[args.field] = value;
  }
  return filter;
}

/**
 * Like `setQuery()`, but merge an existing query into the current one instead
 * of overwriting it.
 */
export function mergeGeoQuery(
  input: unknown,
  args: MergeGeoQueryArgs
): unknown {
  const filter = clone(input) as any;
  return mergeGeoFilter(filter, args);
}

/**
 * takes a center coordinate [lng, lat] and a radius in miles and constructs
 * a circular geoWithin query for the filter.
 *
 * @see https://docs.mongodb.com/manual/tutorial/calculate-distances-using-spherical-geometry-with-2d-geospatial-indexes/
 */
export function setGeoWithinValue(
  input: unknown,
  args: SetGeoWithinValueArgs
): unknown {
  const filter = clone(input) as any;
  const value: any = {};
  const radius = get(args, 'radius', 0);
  const center = get(args, 'center', null);

  if (radius && center) {
    value.$geoWithin = {
      $centerSphere: [[center[0], center[1]], radius],
    };
    filter[args.field] = value;
    return filter;
  }
  // else if center or radius are not set, or radius is 0, clear field
  return clearValue(filter, { field: args.field });
}

const CHANGE_FNS = {
  clearValue,
  setValue,
  setDistinctValues,
  setRangeValues,
  addDistinctValue,
  removeDistinctValue,
  toggleDistinctValue,
  mergeGeoQuery,
  setGeoWithinValue,
};

export type ChangeFilterEvent = {
  [key in keyof typeof CHANGE_FNS]: {
    type: key;
    payload: typeof CHANGE_FNS[key] extends (
      _: unknown,
      args: infer A
    ) => unknown
      ? A
      : never;
  };
}[keyof typeof CHANGE_FNS];

export function changeFilter<FilterName extends keyof typeof CHANGE_FNS>(
  name: FilterName,
  ...args: Parameters<typeof CHANGE_FNS[FilterName]>
) {
  // @ts-expect-error ts wants a tuple here
  return CHANGE_FNS[name](...args);
}
