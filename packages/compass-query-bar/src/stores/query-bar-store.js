import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import queryParser from 'mongodb-query-parser';
import assert from 'assert';
import diff from 'object-diff';
import {
  get,
  has,
  pull,
  pick,
  isBoolean,
  isUndefined,
  isNull,
  isEqual,
  isArray,
  isPlainObject,
  includes,
  every,
  values,
  without,
  mapKeys,
  mapValues,
  assign,
  clone,
  contains,
  omit
} from 'lodash';

import { bsonEqual, hasDistinctValue } from 'mongodb-query-util';
import QUERY_PROPERTIES from 'constants/query-properties';
import {
  USER_TYPING_DEBOUNCE_MS,
  APPLY_STATE,
  DEFAULT_FILTER,
  DEFAULT_PROJECT,
  DEFAULT_SORT,
  DEFAULT_SKIP,
  DEFAULT_COLLATION,
  DEFAULT_LIMIT,
  DEFAULT_SAMPLE,
  DEFAULT_MAX_TIME_MS,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_STATE
} from 'constants/query-bar-store';
import configureQueryChangedStore from './query-changed-store';

const debug = require('debug')('mongodb-compass:stores:query-bar');

const QUERY_CHANGED_STORE = 'Query.ChangedStore';

/**
 * Configure the query bar store.
 *
 * @param {Object} options - The options.
 *
 * @returns {Store} The store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],
    listenables: options.actions,

    /*
     * listen to Namespace store and reset if ns changes.
     */
    onCollectionChanged(ns) {
      const newState = this.getInitialState();
      newState.ns = ns;
      this.setState(newState);
    },

    /**
     * Handle server version updates.
     *
     * @param {String} version - The version.
     */
    onServerVersionChanged(version) {
      this.setState({ serverVersion: version });
    },

    /**
     * Open the export to language dialog.
     */
    exportToLanguage() {
      this.localAppRegistry.emit('open-query-export-to-language', this.state.filterString);
    },

    /**
     * Toggle the query history.
     */
    toggleQueryHistory() {
      this.localAppRegistry.emit('toggle-query-history');
    },

    /**
     * Initialize the query store.
     *
     * @return {Object} the initial store state.
     */
    getInitialState() {
      return {
        // user-facing query properties
        filter: DEFAULT_FILTER,
        project: DEFAULT_PROJECT,
        sort: DEFAULT_SORT,
        collation: DEFAULT_COLLATION,
        skip: DEFAULT_SKIP,
        limit: DEFAULT_LIMIT,
        sample: DEFAULT_SAMPLE,

        // internal query properties
        maxTimeMS: DEFAULT_MAX_TIME_MS,

        // string values for the query bar input fields
        filterString: '',
        projectString: '',
        sortString: '',
        collationString: '',
        skipString: '',
        limitString: '',
        maxTimeMSString: '',

        // whether Apply or Reset was clicked last
        queryState: DEFAULT_STATE, // either apply or reset

        // validation flags
        valid: true,
        filterValid: true,
        projectValid: true,
        sortValid: true,
        collationValid: true,
        skipValid: true,
        limitValid: true,
        sampleValid: true,
        maxTimeMSValid: true,

        // last full query (contains user-facing and internal variables above)
        lastExecutedQuery: null,

        // is the user currently typing (debounced by USER_TYPING_DEBOUNCE_MS)
        userTyping: false,

        // if the value was populated from a click in the schema view or
        // query history view.
        autoPopulated: false,

        // is the query bar component expanded or collapsed?
        expanded: false,

        // set the namespace
        ns: '',

        serverVersion: '3.6.0',

        // Schema fields to use for filter autocompletion
        schemaFields: []
      };
    },

    /**
     * internal method to indicate user stopped typing.
     */
    _stoppedTyping() {
      this.userTypingTimer = null;
      this.setState({
        userTyping: false
      });
    },

    /**
     * toggles between expanded and collapsed query options state.
     *
     * @param {Boolean} force   optional flag to force the extended options
     *                          to be open (true) or closed (false). If not
     *                          specified, the options switch to their opposite
     *                          state.
     */
    toggleQueryOptions(force) {
      this.setState({
        expanded: isBoolean(force) ? force : !this.state.expanded
      });
    },

    /**
     * toggles between sampling on/off. Also can take a value to force sampling
     * to be on or off directly. When sampling is turned on and there is no limit
     * specified, set it to the DEFAULT_SAMPLE_SIZE.
     *
     * @param {Boolean} force   optional flag to force the sampling to be on or
     *                          off. If not specified, the value switches to its
     *                          opposite state.
     */
    toggleSample(force) {
      const newState = {
        sample: isBoolean(force) ? force : !this.state.sample
      };
      if (newState.sample && this.state.limit === 0) {
        newState.limit = DEFAULT_SAMPLE_SIZE;
        newState.limitString = String(DEFAULT_SAMPLE_SIZE);
        newState.limitValid = true;
      }
      this.setState(newState);
    },

    /**
     * like `setQueryString()` except that it also sets the userTyping state to
     * true and starts a debouncing timer to detect when the user stops typing.
     *
     * This is done for performance reasons so we don't re-render all the charts
     * constantly while the string is still being typed.
     *
     * @param {String} label    Which part of the query, e.g. `filter`, `sort`
     * @param {String} input    The query string (i.e. manual user input)
     */
    typeQueryString(label, input) {
      if (this.userTypingTimer) {
        clearTimeout(this.userTypingTimer);
      }
      this.userTypingTimer = setTimeout(
        this._stoppedTyping,
        USER_TYPING_DEBOUNCE_MS
      );
      this.setQueryString(label, input, true);
    },

    /**
     * Sets `queryString` and `valid`, and if it is a valid input, also set `filter`,
     * `sort`, `project`, `collation`, `skip`, `limit`.
     * If it is not a valid query, only set `valid` to `false`.
     *
     * @param {String} label         Which part of the query, e.g. `filter`, `sort`
     * @param {Object} input   the query string (i.e. manual user input)
     * @param {Boolean} userTyping   (optional) whether the user is still typing
     */
    setQueryString(label, input, userTyping) {
      assert(includes(QUERY_PROPERTIES, label));
      const validatedInput = this._validateInput(label, input);

      const state = {
        userTyping: Boolean(userTyping)
      };
      state[`${label}String`] = input;
      state[`${label}Valid`] = validatedInput !== false;

      // if the input was validated, also set the corresponding state variable
      if (validatedInput !== false) {
        state[label] = validatedInput;
        const valid = {
          filter: this.state.filterValid,
          project: this.state.projectValid,
          sort: this.state.sortValid,
          collation: this.state.collationValid,
          skip: this.state.skipValid,
          limit: this.state.limitValid,
          maxTimeMS: this.state.maxTimeMSValid
        };
        valid[label] = validatedInput !== false;
        state.valid = every(values(valid));
      } else {
        state.valid = false;
      }
      state.autoPopulated = !userTyping;
      this.setState(state);
    },

    /**
     * Auto populate the query.
     *
     * @param {Object} query - The query.
     */
    autoPopulateQuery(query) {
      this.setQuery(query, true);
    },

    /**
     * set many/all properties of a query at once. The values are converted to
     * strings, and xxxString is set. The values are validated, and xxxValid is
     * set. the properties themselves are only set for valid values.
     *
     * If `query` is null or undefined, set the default options.
     *
     * @param {Object} query   a query object with some or all query properties set.
     * @param {Boolean} autoPopulated - flag to indicate whether the query was auto-populated or not.
     */
    setQuery(query, autoPopulated = false) {
      if (isUndefined(query) || isNull(query)) {
        query = this._getDefaultQuery();
      }
      // convert all query inputs into their string values and validate them
      const stringProperties = without(QUERY_PROPERTIES, 'sample');
      let inputStrings = mapValues(pick(query, stringProperties), queryParser.stringify);
      let inputValids = mapValues(inputStrings, (val, label) => {
        return this._validateInput(label, val) !== false;
      });

      // store all keys for which the values are true
      const validKeys = [];
      Object.keys(inputValids).forEach((key) => {
        if (inputValids[key] === true) validKeys.push(key);
      });

      // determine if query is valid overall with these new values
      const valid = every(
        values(
          assign(
            {
              filter: this.state.filterValid,
              project: this.state.projectValid,
              sort: this.state.sortValid,
              collation: this.state.collationValid,
              skip: this.state.skipValid,
              limit: this.state.limitValid,
              maxTimeMS: this.state.maxTimeMSValid
            },
            inputValids
          )
        )
      );

      // now rename the keys appropriately to xxxxString and xxxxValid
      inputStrings = mapKeys(inputStrings, (val, label) => {
        return `${label}String`;
      });
      inputValids = mapKeys(inputValids, (val, label) => {
        return `${label}Valid`;
      });

      // merge query, query strings, valid flags into state object
      const state = assign({}, pick(query, validKeys), inputStrings, inputValids);

      // add sample state if available
      if (has(query, 'sample')) {
        this.toggleSample(query.sample);
      }
      state.autoPopulated = autoPopulated;
      state.valid = valid;
      this.setState(state);
    },

    /**
     * returns a clone of the current query.
     *
     * @return {Object}  clone of the query properties.
     */
    _cloneQuery() {
      return mapValues(pick(this.state, QUERY_PROPERTIES), clone);
    },

    /**
     * returns the default query with all the query properties.
     *
     * @return {Object}  new object consisting of all default values.
     */
    _getDefaultQuery() {
      return pick(this.getInitialState(), QUERY_PROPERTIES);
    },

    /**
     * routes to the correct validation function.
     *
     * @param {String} label   one of `filter`, `project`, `sort`, `collation`, `skip`, `limit`
     * @param {String} input   the input to validated
     *
     * @return {Boolean|String}   false if not valid, otherwise the potentially
     *                            cleaned-up string input.
     */
    _validateInput(label, input) {
      return queryParser.validate(label, input);
    },

    /**
     * returns true if all components of the query are not false.
     * (note: they can return a value 0, which should not be interpreted as
     * false here.)
     *
     * @return {Boolean}  if the full query is valid.
     */
    _validateQuery() {
      return (
        queryParser.isFilterValid(this.state.filterString) !== false &&
        queryParser.isProjectValid(this.state.projectString) !== false &&
        queryParser.isSortValid(this.state.sortString) !== false &&
        queryParser.isCollationValid(this.state.collationString) !== false &&
        queryParser.isSkipValid(this.state.skipString) !== false &&
        queryParser.isLimitValid(this.state.limitString) !== false &&
        queryParser.isMaxTimeMSValid(this.state.maxTimeMSString) !== false
      );
    },

    /**
     * Sets the value for the given field on the filter.
     *
     * @param {Object} args   arguments must include `field` and `value`, and
     *                        can optionally include `unsetIfSet`:
     *          field         the field of the query to set the value on.
     *          value         the value to set.
     *          unsetIfSet    (optional) boolean, unsets the value if an identical
     *                        value is already set. This is useful for the toggle
     *                        behavior we use on minichart bars.
     */
    setValue(args) {
      const filter = clone(this.state.filter);
      if (
        args.unsetIfSet &&
        isEqual(filter[args.field], args.value, bsonEqual)
      ) {
        delete filter[args.field];
      } else {
        filter[args.field] = args.value;
      }
      this.setQuery({ filter: filter }, true);
    },

    /**
     * takes either a single value or an array of values, and sets the value on
     * the filter correctly as equality or $in depending on the number of values.
     *
     * @param {Object} args   arguments must include `field` and `value`:
     *          field         the field of the query to set the value on.
     *          value         the value(s) to set. Can be a single value or an
     *                        array of values, in which case `$in` is used.
     */
    setDistinctValues(args) {
      const filter = clone(this.state.filter);
      if (isArray(args.value)) {
        if (args.value.length > 1) {
          filter[args.field] = { $in: args.value };
        } else if (args.value.length === 1) {
          filter[args.field] = args.value[0];
        } else {
          this.clearValue(args);
        }
        this.setQuery({ filter: filter }, true);
        return;
      }
      filter[args.field] = args.value;
      this.setQuery({ filter: filter }, true);
    },

    /**
     * clears a field from the filter
     *
     * @param {Object} args  arguments must include `field`:
     *          field        the field of the query to set the value on.
     */
    clearValue(args) {
      const filter = clone(this.state.filter);
      delete filter[args.field];
      this.setQuery({ filter: filter }, true);
    },

    /**
     * adds a discrete value to a field on the filter, converting primitive
     * values to $in lists as required.
     *
     * @param {Object} args    object with a `field` and `value` key.
     */
    addDistinctValue(args) {
      const filter = clone(this.state.filter);
      const field = get(filter, args.field, undefined);

      // field not present in filter yet, add primitive value
      if (field === undefined) {
        filter[args.field] = args.value;
        this.setQuery({ filter: filter }, true);
        return;
      }
      // field is object, could be a $in clause or a primitive value
      if (isPlainObject(field)) {
        if (has(field, '$in')) {
          // add value to $in array if it is not present yet
          const inArray = filter[args.field].$in;
          if (!contains(inArray, args.value)) {
            filter[args.field].$in.push(args.value);
            this.setQuery({ filter: filter }, true);
          }
          return;
        }
        // it is not a $in operator, replace the value
        filter[args.field] = args.value;
        this.setQuery({ filter: filter }, true);
        return;
      }
      // in all other cases, we want to turn a primitive value into a $in list
      filter[args.field] = { $in: [field, args.value] };
      this.setQuery({ filter: filter }, true);
    },

    /**
     * removes a distinct value from a field on the filter, converting primitive
     * values to $in lists as required.
     *
     * @param {Object} args    object with a `field` and `value` key.
     */
    removeDistinctValue(args) {
      const filter = clone(this.state.filter);
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
          this.setQuery({ filter: filter }, true);
          return;
        }
      }
      // if value to remove is the same as the primitive value, unset field
      if (isEqual(field, args.value, bsonEqual)) {
        delete filter[args.field];
        this.setQuery({ filter: filter }, true);
        return;
      }
      // else do nothing
      return;
    },

    /**
     * adds distinct value (equality or $in) from filter if not yet present,
     * otherwise removes it.
     *
     * @param {Object} args    object with a `field` and `value` key.
     */
    toggleDistinctValue(args) {
      const field = get(this.state.filter, args.field, undefined);
      const actionFn = hasDistinctValue(field, args.value)
        ? this.removeDistinctValue
        : this.addDistinctValue;
      actionFn(args);
    },

    /**
     * Sets a range with minimum and/or maximum, and determines inclusive/exclusive
     * upper and lower bounds. If neither `min` nor `max` are set, clears the field
     * on the filter.
     *
     * @param {Object} args   arguments must include `field`, and can optionally
     *                        include `min`, `max`, `minInclusive`, `maxInclusive`
     *                        and `unsetIfSet`:
     *          field         the field of the query to set the value on.
     *          min           (optional) the minimum value (lower bound)
     *          minInclusive  (optional) boolean, true uses $gte, false uses $gt
     *                        default is true.
     *          max           (optional) the maximum value (upper bound)
     *          maxInclusive  (optional) boolean, true uses $lte, false uses $lt
     *                        default is false.
     *          unsetIfSet    (optional) boolean, unsets the value if an identical
     *                        value is already set. This is useful for the toggle
     *                        behavior we use on minichart bars.
     */
    setRangeValues(args) {
      const filter = clone(this.state.filter);
      const value = {};
      let op;
      // without min and max, clear the field
      const minValue = get(args, 'min', undefined);
      const maxValue = get(args, 'max', undefined);
      if (minValue === undefined && maxValue === undefined) {
        this.clearValue({ field: args.field });
        return;
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
      if (args.unsetIfSet && isEqual(filter[args.field], value, bsonEqual)) {
        delete filter[args.field];
      } else {
        filter[args.field] = value;
      }
      this.setQuery({ filter: filter }, true);
    },

    /**
     * takes a center coordinate [lng, lat] and a radius in miles and constructs
     * a circular geoWithin query for the filter.
     *
     * @param {Object} args   arguments must include `field` and `value`:
     *          field         the field of the query to set the value on.
     *          center        array of two numeric values: longitude and latitude
     *          radius        radius in miles of the circle
     *
     * @see https://docs.mongodb.com/manual/tutorial/calculate-distances-using-spherical-geometry-with-2d-geospatial-indexes/
     */
    setGeoWithinValue(args) {
      const filter = clone(this.state.filter);
      const value = {};
      const radius = get(args, 'radius', 0);
      const center = get(args, 'center', null);

      if (radius && center) {
        value.$geoWithin = {
          $centerSphere: [[center[0], center[1]], radius]
        };
        filter[args.field] = value;
        this.setQuery({ filter: filter }, true);
        return;
      }
      // else if center or radius are not set, or radius is 0, clear field
      this.clearValue({ field: args.field });
    },

    /**
     * apply the current (valid) query, and store it in `lastExecutedQuery`.
     */
    apply() {
      if (this._validateQuery()) {
        const registry = this.localAppRegistry;
        if (registry) {
          const newState = {
            filter: this.state.filter,
            project: this.state.project,
            sort: this.state.sort,
            collation: this.state.collation,
            skip: this.state.skip,
            limit: this.state.limit,
            ns: this.state.ns,
            maxTimeMS: this.state.maxTimeMS
          };
          registry.emit('query-applied', newState);
        }

        this.setState({
          valid: true,
          queryState: APPLY_STATE,
          lastExecutedQuery: this._cloneQuery()
        });
      }
    },

    /**
     * dismiss current changes to the query and restore `{}` as the query.

     *  @note The wacky logic here is because the ampersand app is not
     *  loaded in the unit test environment and the validation tests fail since
     *  not app registry is found. Once we get rid of the ampersand app we can
     *  put the store set back into the init once we've sorted out the proper
     *  test strategy. Same as collection-stats and collections-store.
     */
    reset() {
      // if the current query is the same as the default, nothing happens
      if (isEqual(this._cloneQuery(), this._getDefaultQuery())) {
        return;
      }

      // if the last executed query is the default query, we don't need to
      // change lastExecuteQuery and trigger a change in the QueryChangedStore.
      if (isEqual(this.state.lastExecutedQuery, this._getDefaultQuery())) {
        this.setQuery();
        return;
      }

      // otherwise we do need to trigger the QueryChangedStore and let all other
      // components in the app know about the change so they can re-render.
      if (this.state.valid) {
        const newState = this.getInitialState();
        newState.ns = this.state.ns;
        newState.autoPopulated = true;
        this.setState(omit(newState, 'expanded'));
      }
      options.actions.refreshEditor();
    },

    storeDidUpdate(prevState) {
      debug('query store changed', diff(prevState, this.state));
    }
  });

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.localAppRegistry = localAppRegistry;

    localAppRegistry.on('auto-populate-query', (query) => {
      store.autoPopulateQuery(query);
    });
    localAppRegistry.on('fields-changed', (fields) => {
      store.setState({ schemaFields: fields.aceFields });
    });
    localAppRegistry.on('subtab-changed', () => {
      options.actions.refreshEditor();
    });

    // Put the query changed store in the app registry
    // if it is not already there.
    const queryChangedStore = localAppRegistry.getStore(QUERY_CHANGED_STORE);
    if (!queryChangedStore.onQueryBarStoreChanged) {
      options.store = store;
      localAppRegistry.registerStore(QUERY_CHANGED_STORE, configureQueryChangedStore(options));
    }
  }

  if (options.namespace) {
    store.onCollectionChanged(options.namespace);
  }
  if (options.serverVersion) {
    store.onServerVersionChanged(options.serverVersion);
  }

  return store;
};

export default configureStore;
