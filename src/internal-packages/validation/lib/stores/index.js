const Reflux = require('reflux');
const ValidationActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const _ = require('lodash');
const ruleCategories = require('../components/rule-categories');
const helper = require('./helpers');
const toNS = require('mongodb-ns');
const app = require('hadron-app');

// stores
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;

const debug = require('debug')('mongodb-compass:stores:validation');

/**
 * Validation store.
 */

const ValidationStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: ValidationActions,

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
    this.lastFetchedValidatorDoc = {};
    NamespaceStore.listen((ns) => {
      if (ns && toNS(ns).collection) {
        ValidationActions.fetchValidationRules();
      }
    });
  },

  /**
   * Initialize the Validation store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      viewMode: 'Rule Builder',    // one of `Rule Builder`, `JSON`
      validatorDoc: {},            // the validator doc fetched from the server
      validationRules: [],         // array of rules as defined below
      validationLevel: 'off',      // one of `off`, `moderate`, `strict`
      validationAction: 'warn',    // one of `warn`, `error`
      fetchState: 'initial',       // one of `initial`, `fetching`, `success`, `error`
      editState: 'unmodified',     // one of `unmodified`, `modified`, `updating`, `success`, `error`
      isExpressibleByRules: true,  // boolean
      serverVersion: ''
    };
  },

  /**
   * takes a validator document and constructs individual rules if possible.
   *
   * If the validatorDoc format is incorrect, returns false. Otherwise returns
   * an Object with keys `rules`, `validationLevel` and `validationAction`.
   *
   * If the validator doc can be expressed as rules, the `rules` value is
   * an array of rules, otherwise it is `false`.
   *
   * @param {Object} validatorDoc   object to extract rules from.
   *
   * @return {Object|Boolean}  false if error encountered, otherwise an object
   *                           of rules, validationLevel, validationAction
   *                           (see above).
   */
  _deconstructValidatorDoc(validatorDoc) {
    if (!_.has(validatorDoc, 'validator')) {
      // no validator doc present, create an empty doc
      validatorDoc.validator = {};
    }

    const validator = helper.filterAndFromValidator(validatorDoc.validator);

    const rules = _.map(validator, (field, idx) => {
      const fieldName = field[0];
      const rule = field[1];

      let parameters;
      const result = helper.nullableOrValidator(fieldName, rule);

      const category = _.findKey(ruleCategories, (cat) => {
        parameters = cat.queryToParams(result.value);
        return parameters;
      });
      // no rule category could be found to express this rule
      if (!category) {
        return false;
      }
      return {
        id: `rule-${idx}`,
        field: result.field,
        category: category,
        parameters: parameters,
        nullable: result.nullable
      };
    });
    if (!_.every(rules)) {
      return {
        rules: false,
        level: _.get(validatorDoc, 'validationLevel', 'off'),
        action: _.get(validatorDoc, 'validationAction', 'warn')
      };
    }
    return {
      rules: rules,
      level: _.get(validatorDoc, 'validationLevel', 'off'),
      action: _.get(validatorDoc, 'validationAction', 'warn')
    };
  },

  /**
   * Takes individual rules or a validatorDoc, validationLevel and
   * validationAction and returns a complete validatorDoc.
   *
   * @param {Object} params  an object containing the fields `rules`, `level`,
   *                         and `action`:
   *                         rules:  array of rules, or false if validatorDoc
   *                                 is not expressible as rules.
   *                         level:  one of `off`, `moderate`, `strict`
   *                         action: one of `warn`, `error`
   *
   * @returns {Object}   a validatorDoc that can be sent back to the server.
   */
  _constructValidatorDoc(params) {
    let validator;
    let hasMultipleNulls;
    if (params.rules) {
      hasMultipleNulls = helper.hasMultipleNullables(params.rules);
      if (hasMultipleNulls) {
        validator = _(params.rules)
          .map((rule) => {
            let field = rule.field;
            let value = rule.category ?
              ruleCategories[rule.category].paramsToQuery(rule.parameters) :
              {};
            if (rule.nullable) {
              value = helper.nullableOrQueryWrapper(value, field);
              field = '$or';
            }
            const wrapper = {};
            wrapper[field] = value;
            return wrapper;
          })
          .value();
      } else {
        validator = _(params.rules)
          .map((rule) => {
            let field = rule.field;
            let value = rule.category ?
              ruleCategories[rule.category].paramsToQuery(rule.parameters) :
              {};
            if (rule.nullable) {
              value = helper.nullableOrQueryWrapper(value, field);
              field = '$or';
            }
            return [field, value];
          })
          .zipObject()
          .value();
      }

      if (hasMultipleNulls) {
        validator = {'$and': validator};
      }
    } else {
      validator = this.state.validatorDoc.validator;
    }
    return {
      validator: validator,
      validationLevel: params.level,
      validationAction: params.action
    };
  },

  /**
   * After any of the rules are modified through one of the actions below,
   * compute the new validatorDoc and compare it to the last fetched one.
   * Store the new rules in the state along with the editState and update
   * validatorDoc.
   *
   * This function modifies the state!
   *
   * @param {Object} params   object containing the fields `rules`, `level`,
   *                          `action`. Uses the state values as defaults.
   */
  _updateState(params) {
    params = _.defaults(params, {
      rules: this.state.validationRules,
      level: this.state.validationLevel,
      action: this.state.validationAction
    });

    // update current validatorDoc and compare to last fetched one
    const validatorDoc = this._constructValidatorDoc(params);

    const state = {
      validatorDoc: validatorDoc,
      validationRules: params.rules,
      validationLevel: params.level,
      validationAction: params.action,
      isExpressibleByRules: _.isArray(params.rules)
    };

    // check if lastFetchedValidatorDoc is completely blank and set editState appropriately
    if (!_.has(this.lastFetchedValidatorDoc, 'validationAction')
        && !_.has(this.lastFetchedValidatorDoc, 'validationLevel')
        && _.isEmpty(this.lastFetchedValidatorDoc.validator)) {
      state.editState = _.isEmpty(validatorDoc.validator) ? 'unmodified' : 'modified';
    } else {
      state.editState = _.isEqual(this.lastFetchedValidatorDoc,
          validatorDoc) ? 'unmodified' : 'modified';
    }

    this.setState(state);
  },

  /**
   * fetches the validator doc from the server (async).
   *
   * @todo replace with actual dataService call
   *
   * @param {Function} callback   function to call with (err, res) from server.
   */
  _fetchFromServer(callback) {
    const ns = toNS(NamespaceStore.ns);

    if (this.state.serverVersion === '') {
      const serverVersion = app.instance.build.version;
      this.setState({serverVersion: serverVersion});
    }
    app.dataService.listCollections(ns.database, {name: ns.collection}, function(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, res[0]);
    });
  },

  /**
   * Determine if the collection is readonly.
   *
   * @note Durran: The wacky logic here is because the ampersand app is not
   *  loaded in the unit test environment and the validation tests fail since
   *  not app registry is found. Once we get rid of the ampersand app we can
   *  put the store set back into the init once we've sorted out the proper
   *  test strategy.
   *
   * @returns {Boolean} If the collection is readonly.
   */
  _isCollectionReadonly() {
    if (this.CollectionStore) {
      return this.CollectionStore.isReadonly();
    }
    const registry = app.appRegistry;
    if (registry) {
      this.CollectionStore = registry.getStore('App.CollectionStore');
      return this.CollectionStore.isReadonly();
    }
    return false;
  },

  fetchValidationRules() {
    if (this._isCollectionReadonly()) {
      this.setState(this.getInitialState());
    } else {
      this.setState({
        fetchState: 'fetching'
      });
      this._fetchFromServer((err, res) => {
        if (err || !_.has(res, 'options')) {
          // an error occured during fetch, e.g. missing permissions
          this.setState({
            fetchState: 'error'
          });
          return;
        }
        const result = this._deconstructValidatorDoc(res.options);

        // store result from server
        const validatorDoc = res.options;
        this.lastFetchedValidatorDoc = _.clone(validatorDoc);

        if (!result) {
          // the validatorDoc has an unexpected format.
          this.setState({
            fetchState: 'error'
          });
          return;
        }

        if (!_.isPlainObject(result)) {
          // the return value is not falsey but also not an object. This should
          // never happen!
          this.setState({
            fetchState: 'error'
          });
          return;
        }

        if (!result.rules) {
          // the validatorDoc cannot be expressed as simple rules.
          this.setState({
            fetchState: 'success',
            isExpressibleByRules: false,
            viewMode: 'JSON',
            validatorDoc: validatorDoc,
            validationLevel: result.level,
            validationAction: result.action,
            editState: 'unmodified'
          });
          return;
        }

        // the validator Doc _can_ be expressed as simple rules.
        this.setState({
          fetchState: 'success',
          isExpressibleByRules: true,
          viewMode: 'Rule Builder',
          validatorDoc: validatorDoc,
          validationRules: result.rules,
          validationLevel: result.level,
          validationAction: result.action,
          editState: 'unmodified'
        });
      });
    }
  },

  addValidationRule() {
    const rules = _.clone(this.state.validationRules);
    const id = `rule-${rules.length}`;
    rules.push({
      id: id,
      field: '',
      category: '',
      parameters: {},
      nullable: false
    });

    this._updateState({rules: rules});
  },

  deleteValidationRule(id) {
    const rules = _.clone(this.state.validationRules);
    const ruleIndex = _.findIndex(rules, 'id', id);
    rules.splice(ruleIndex, 1);

    this._updateState({rules: rules});
  },

  setRuleField(id, field) {
    const rules = _.clone(this.state.validationRules);
    const ruleIndex = _.findIndex(rules, 'id', id);
    rules[ruleIndex].field = field;

    this._updateState({rules: rules});
  },

  setRuleCategory(id, category) {
    const rules = _.clone(this.state.validationRules);
    const ruleIndex = _.findIndex(rules, 'id', id);
    if (category !== rules[ruleIndex].category &&
      _.includes(_.keys(ruleCategories), category)) {
      rules[ruleIndex].category = category;
      rules[ruleIndex].parameters = ruleCategories[category].getInitialParameters();
      if (_.contains(['exists', 'mustNotExist'], category)) {
        rules[ruleIndex].nullable = false;
      }
      this._updateState({rules: rules});
    }
  },

  setRuleParameters(id, params) {
    const rules = _.clone(this.state.validationRules);
    const ruleIndex = _.findIndex(rules, 'id', id);
    rules[ruleIndex].parameters = params;

    this._updateState({rules: rules});
  },

  setRuleNullable(id, value) {
    if (!id || !_.isBoolean(value)) {
      return;
    }
    const rules = _.clone(this.state.validationRules);
    const ruleIndex = _.findIndex(rules, 'id', id);
    rules[ruleIndex].nullable = value;

    this._updateState({rules: rules});
  },

  setValidatorDocument(validatorDoc) {
    const result = this._deconstructValidatorDoc(validatorDoc);

    this.setState({
      validatorDoc: validatorDoc,
      validationRules: result.rules || [],
      validationLevel: result.level,
      validationAction: result.action,
      isExpressibleByRules: _.isArray(result.rules),
      editState: _.isEqual(this.lastFetchedValidatorDoc, validatorDoc) ?
        'unmodified' : 'modified'
    });
  },

  setValidationAction(validationAction, setByRuleBuilder) {
    if (!_.includes(['warn', 'error'], validationAction)) {
      return;
    }
    if (setByRuleBuilder) {
      this._updateState({action: validationAction});
      return;
    }
    const validatorDoc = _.clone(this.state.validatorDoc);
    validatorDoc.validationAction = validationAction;
    this.setState({
      validatorDoc: validatorDoc,
      validationAction: validationAction,
      editState: _.isEqual(this.lastFetchedValidatorDoc, validatorDoc) ?
        'unmodified' : 'modified'
    });
  },

  setValidationLevel(validationLevel, setByRuleBuilder) {
    if (!_.includes(['off', 'moderate', 'strict'], validationLevel)) {
      return;
    }
    if (setByRuleBuilder) {
      this._updateState({level: validationLevel});
      return;
    }
    const validatorDoc = _.clone(this.state.validatorDoc);
    validatorDoc.validationLevel = validationLevel;
    this.setState({
      validatorDoc: validatorDoc,
      validationLevel: validationLevel,
      editState: _.isEqual(this.lastFetchedValidatorDoc, validatorDoc) ?
        'unmodified' : 'modified'
    });
  },

  /**
   * switches the view mode between `Rule Builder` and `JSON`.
   *
   * @param {String} viewMode   one of `Rule Builder`, `JSON`.
   */
  switchView(viewMode) {
    if (_.includes(['Rule Builder', 'JSON'], viewMode)) {
      this.setState({
        viewMode: viewMode
      });
    }
  },

  cancelChanges() {
    const params = this._deconstructValidatorDoc(this.lastFetchedValidatorDoc);
    this._updateState(params);
  },

  saveChanges() {
    this.setState({
      editState: 'updating'
    });
    app.dataService.updateCollection(NamespaceStore.ns, this.state.validatorDoc, (err) => {
      if (err) {
        this.setState({
          editState: 'error'
        });
        return;
      }
      this.setState({
        editState: 'success'
      });
      setTimeout(() => {
        this.lastFetchedValidatorDoc = _.clone(this.state.validatorDoc);
        this.setState({
          editState: 'unmodified'
        });
      }, 1000);
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('Validation store changed from', prevState, 'to', this.state);
  }
});

module.exports = ValidationStore;
