const app = require('ampersand-app');
const Reflux = require('reflux');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const StateMixin = require('reflux-state-mixin');
const QueryAction = require('../action');
const EJSON = require('mongodb-extended-json');
const Query = require('mongodb-language-model').Query;
const _ = require('lodash');
const hasDistinctValue = require('../util').hasDistinctValue;
const filterChanged = require('hadron-action').filterChanged;
const bsonEqual = require('../util').bsonEqual;

const debug = require('debug')('mongodb-compass:stores:query');
// const metrics = require('mongodb-js-metrics')();

const USER_TYPING_DEBOUNCE_MS = 100;
const FEATURE_FLAG_REGEX = /^(enable|disable) (\w+)\s*$/;

/**
 * The reflux store for the schema.
 */
const QueryStore = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: QueryAction,

  /**
   * listen to Namespace store and reset if ns changes.
   */
  init: function() {
    this.validFeatureFlags = _.keys(_.pick(app.preferences.serialize(), _.isBoolean));
    NamespaceStore.listen(() => {
      // reset the store
      this.setState(this.getInitialState());
    });
  },

  /**
   * Initialize the document list store.
   *
   * @return {Object} the initial store state.
   */
  getInitialState() {
    return {
      query: {},
      queryString: '',
      valid: true,
      featureFlag: false,
      lastExecutedQuery: null,
      userTyping: false
    };
  },

  _stoppedTyping() {
    this.userTypingTimer = null;
    this.setState({
      userTyping: false
    });
  },

  /**
   * like `setQueryString()` except that it also sets the userTyping state to
   * true and starts a debouncing timer to detect when the user stops typing.
   *
   * This is done for performance reasons so we don't re-render all the charts
   * constantly while the string is still being typed.
   *
   * @param {String} queryString    The query string (i.e. manual user input)
   */
  typeQueryString(queryString) {
    if (this.userTypingTimer) {
      clearTimeout(this.userTypingTimer);
    }
    this.userTypingTimer = setTimeout(this._stoppedTyping, USER_TYPING_DEBOUNCE_MS);
    this.setQueryString(queryString, true);
  },

  /**
   * Sets `queryString` and `valid`, and if it is a valid query, also set `query`.
   * If it is not a valid query, set `valid` to `false` and don't set the query.
   *
   * @param {Object} queryString   the query string (i.e. manual user input)
   * @param {Boolean} userTyping   (optional) whether the user is still typing
   */
  setQueryString(queryString, userTyping) {
    const query = this._validateQueryString(queryString);
    const isFeatureFlag = Boolean(this._validateFeatureFlag(queryString));
    const state = {
      queryString: queryString,
      valid: Boolean(query),
      featureFlag: isFeatureFlag,
      userTyping: Boolean(userTyping)
    };
    if (query) {
      state.query = query;
    }
    this.setState(state);
  },

  _cleanQueryString(queryString) {
    let output = queryString;
    // accept whitespace-only input as empty query
    if (_.trim(output) === '') {
      output = '{}';
    }
    // wrap field names in double quotes. I appologize for the next line of code.
    // @see http://stackoverflow.com/questions/6462578/alternative-to-regex-match-all-instances-not-inside-quotes
    // @see https://regex101.com/r/xM7iH6/1
    output = output.replace(/([{,])\s*([^,{\s\'"]+)\s*:(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g, '$1"$2":');
    // replace multiple whitespace with single whitespace
    output = output.replace(/\s+/g, ' ');
    return output;
  },

  /**
   * validates whether a string is a valid query.
   *
   * @param  {Object} queryString    a string to validate
   * @return {Object|Boolean}        false if invalid, otherwise the query
   */
  _validateQueryString(queryString) {
    let parsed;
    try {
      // is it valid eJSON?
      const cleaned = this._cleanQueryString(queryString);
      parsed = EJSON.parse(cleaned);
      // is it a valid parsable Query according to the language?
      /* eslint no-unused-vars: 0 */
      const query = new Query(parsed, {
        parse: true
      });
    } catch (e) {
      return false;
    }
    return parsed;
  },

  _validateFeatureFlag(queryString) {
    const match = queryString.match(FEATURE_FLAG_REGEX);
    if (match && _.contains(this.validFeatureFlags, match[2])) {
      return match;
    }
    return false;
  },

  _checkFeatureFlagDirective() {
    const match = this._validateFeatureFlag(this.state.queryString);
    if (match) {
      app.preferences.save(match[2], match[1] === 'enable');
      debug('feature flag %s %sd', match[2], match[1]);
      return true;
    }
    return false;
  },

  /**
   * sets the query and the query string, and computes `valid`.
   *
   * @param {Object} query   a valid query.
   */
  setQuery(query) {
    const queryString = EJSON.stringify(query);
    const valid = this._validateQueryString(queryString);
    this.setState({
      query: query,
      queryString: queryString,
      valid: Boolean(valid),
      featureFlag: false
    });
  },

  /**
   * Sets the value for the given field.
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
    const query = _.clone(this.state.query);
    if (args.unsetIfSet && _.isEqual(query[args.field], args.value, bsonEqual)) {
      delete query[args.field];
    } else {
      query[args.field] = args.value;
    }
    this.setQuery(query);
  },

  /**
   * takes either a single value or an array of values, and sets the value
   * correctly as equality or $in depending on the number of values.
   *
   * @param {Object} args   arguments must include `field` and `value`:
   *          field         the field of the query to set the value on.
   *          value         the value(s) to set. Can be a single value or an
   *                        array of values, in which case `$in` is used.
   */
  setDistinctValues(args) {
    const query = _.clone(this.state.query);
    if (_.isArray(args.value)) {
      if (args.value.length > 1) {
        query[args.field] = {$in: args.value};
      } else if (args.value.length === 1) {
        query[args.field] = args.value[0];
      } else {
        this.clearValue(args);
      }
      this.setQuery(query);
      return;
    }
    query[args.field] = args.value;
    this.setQuery(query);
  },

  clearValue(args) {
    const query = _.clone(this.state.query);
    delete query[args.field];
    this.setQuery(query);
  },

  /**
   * adds a discrete value to a field, converting primitive values to $in lists
   * as required.
   *
   * @param {Object} args    object with a `field` and `value` key.
   */
  addDistinctValue(args) {
    const query = _.clone(this.state.query);
    const field = _.get(query, args.field, undefined);

    // field not present in query yet, add primitive value
    if (field === undefined) {
      query[args.field] = args.value;
      this.setQuery(query);
      return;
    }
    // field is object, could be a $in clause or a primitive value
    if (_.isPlainObject(field)) {
      if (_.has(field, '$in')) {
        // add value to $in array if it is not present yet
        const inArray = query[args.field].$in;
        if (!_.contains(inArray, args.value)) {
          query[args.field].$in.push(args.value);
          this.setQuery(query);
        }
        return;
      }
      // it is not a $in operator, replace the value
      query[args.field] = args.value;
      this.setQuery(query);
      return;
    }
    // in all other cases, we want to turn a primitive value into a $in list
    query[args.field] = {$in: [field, args.value]};
    this.setQuery(query);
  },

  removeDistinctValue(args) {
    const query = _.clone(this.state.query);
    const field = _.get(query, args.field, undefined);

    if (field === undefined) {
      return;
    }

    if (_.isPlainObject(field)) {
      if (_.has(field, '$in')) {
        // add value to $in array if it is not present yet
        const inArray = query[args.field].$in;
        const newArray = _.pull(inArray, args.value);
        // if $in array was reduced to single value, replace with primitive
        if (newArray.length > 1) {
          query[args.field].$in = newArray;
        } else if (newArray.length === 1) {
          query[args.field] = newArray[0];
        } else {
          delete query[args.field];
        }
        this.setQuery(query);
        return;
      }
    }
    // if value to remove is the same as the primitive value, unset field
    if (_.isEqual(field, args.value, bsonEqual)) {
      delete query[args.field];
      this.setQuery(query);
      return;
    }
    // else do nothing
    return;
  },

  /**
   * adds distinct value (equality or $in) if not yet present, otherwise
   * removes it.
   *
   * @param {Object} args    object with a `field` and `value` key.
   */
  toggleDistinctValue(args) {
    const field = _.get(this.state.query, args.field, undefined);
    const actionFn = hasDistinctValue(field, args.value) ?
      this.removeDistinctValue : this.addDistinctValue;
    actionFn(args);
  },

  /**
   * Sets a range with minimum and/or maximum, and determines inclusive/exclusive
   * upper and lower bounds. If neither `min` nor `max` are set, clears the field.
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
    const query = _.clone(this.state.query);
    const value = {};
    let op;
    // without min and max, clear the field
    const minValue = _.get(args, 'min', undefined);
    const maxValue = _.get(args, 'max', undefined);
    if (minValue === undefined && maxValue === undefined) {
      this.clearValue({field: args.field});
      return;
    }

    if (minValue !== undefined) {
      op = _.get(args, 'minInclusive', true) ? '$gte' : '$gt';
      value[op] = minValue;
    }

    if (maxValue !== undefined) {
      op = _.get(args, 'maxInclusive', false) ? '$lte' : '$lt';
      value[op] = maxValue;
    }

    // if `args.unsetIfSet` is true, then unset the value if it's already set
    if (args.unsetIfSet && _.isEqual(query[args.field], value, bsonEqual)) {
      delete query[args.field];
    } else {
      query[args.field] = value;
    }
    this.setQuery(query);
  },

  /**
   * takes a center coordinate [lng, lat] and a radius in miles and constructs
   * a circular geoWithin query.
   *
   * @param {Object} args   arguments must include `field` and `value`:
   *          field         the field of the query to set the value on.
   *          center        array of two numeric values: longitude and latitude
   *          radius        radius in miles of the circle
   *
   * @see https://docs.mongodb.com/manual/tutorial/calculate-distances-using-spherical-geometry-with-2d-geospatial-indexes/
   */
  setGeoWithinValue(args) {
    const query = _.clone(this.state.query);
    const value = {};
    const radius = _.get(args, 'radius', 0);
    const center = _.get(args, 'center', null);

    if (radius && center) {
      value.$geoWithin = {
        $centerSphere: [[center[0], center[1]], radius]
      };
      query[args.field] = value;
      this.setQuery(query);
      return;
    }
    // else if center or radius are not set, or radius is 0, clear field
    this.clearValue({field: args.field});
  },

  /**
   * apply the current (valid) query, and store it in `lastExecutedQuery`.
   */
  apply() {
    if (this._checkFeatureFlagDirective()) {
      this.setQuery(this.state.lastExecutedQuery || {});
      return;
    }

    if (this.state.valid) {
      this.setState({
        lastExecutedQuery: _.clone(this.state.query)
      });
      // start queries for all tabs: schema, documents, explain, indexes
      // @todo don't hard-code this
      const SchemaAction = app.appRegistry.getAction('Schema.Actions');
      SchemaAction.startSampling();
      const ExplainActions = app.appRegistry.getAction('Explain.Actions');
      ExplainActions.fetchExplainPlan();
      filterChanged(this.state.query);
    }
  },

  /**
   * dismiss current changes to the query
   */
  reset() {
    this.setState(this.getInitialState());
    const SchemaAction = app.appRegistry.getAction('Schema.Actions');
    SchemaAction.startSampling();
    const ExplainActions = app.appRegistry.getAction('Explain.Actions');
    ExplainActions.resetExplainPlan();
    filterChanged(this.state.query);
  },

  storeDidUpdate(prevState) {
    debug('query store changed from', prevState, 'to', this.state);
  }

});

module.exports = QueryStore;
