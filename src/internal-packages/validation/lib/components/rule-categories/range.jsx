const React = require('react');
const _ = require('lodash');
const ValidationAction = require('../../actions');
const RangeInput = require('../common/range-input');
const TypeChecker = require('hadron-type-checker');
const app = require('ampersand-app');
const bootstrap = require('react-bootstrap');
const FormGroup = bootstrap.FormGroup;

// const debug = require('debug')('mongodb-compass:validation');

/**
  * The version at which high precision values are available.
  */
const HP_VERSION = '3.4.0';

class RuleCategoryRange extends React.Component {

  constructor(props) {
    super(props);
    // this tracks whether the children individually are valid or not.
    // it is a bit unusually to make this an instance variable, but since
    // the component does not have to re-render itself when this changes,
    // it's ok. We also had issues making this part of state because the
    // state does not update immediately, which was causing issues.
    //
    // @see http://stackoverflow.com/questions/30782948/why-calling-react-setstate-method-doesnt-mutate-the-state-immediately
    this.childrenIndividuallyValid = true;

    // Additionally, we maintain the validation states of the two
    // children so that we can determine if both of them are valid.
    this.isValid = true;
    this.childValidationStates = {};

    // We are forking the `parameters` passed in as props here, and are
    // updating them whenever a child component changes its values
    // (onRangeInputBlur).
    this.state = {
      parameters: _.clone(this.props.parameters)
    };
  }

  componentWillMount() {
    this.props.validate(true);
  }

  /**
   * callback called by the child components (<RangeInput />) whenever
   * they change their value or operator. This method then updates the
   * internal `state.parameters` accordingly and determines if the two
   * combined values are still considered a valid state or not.
   *
   * Note: individual value validation (i.e. are both children individually
   * valid) happens in `this.validate()` and is tracked by
   * this.childrenIndividuallyValid.
   *
   * @param {String} key    the key of the child component, `lower` or `upper`
   * @param {Object} value  the value passed up from the child of the shape
   *                        { value: ..., operator: ... }
   */
  onRangeInputBlur(key, value) {
    const opMap = {
      '>=': '$gte',
      '>': '$gt',
      '<=': '$lte',
      '<': '$lt'
    };

    const params = _.clone(this.state.parameters);

    if (key === 'lower') {
      if (value.operator === 'none') {
        params.lowerBoundType = null;
      } else {
        params.lowerBoundType = opMap[value.operator];
        params.lowerBoundValue = value.value;
      }
    }

    if (key === 'upper') {
      if (value.operator === 'none') {
        params.upperBoundType = null;
      } else {
        params.upperBoundType = opMap[value.operator];
        params.upperBoundValue = value.value;
      }
    }

    this.setState({
      parameters: params
    });

    // this component is valid if the children are individually valid and
    // their combined values are also valid.
    this.isValid = this.validateCombinedValues(
      params.lowerBoundType && params.lowerBoundValue,
      params.upperBoundType && params.upperBoundValue
    ) && this.childrenIndividuallyValid;

    // report up the chain to the parent our overall valid state
    this.props.validate(this.isValid);
    if (this.isValid) {
      ValidationAction.setRuleParameters(this.props.id, params);
    }
  }

  static getInitialParameters() {
    return {
      upperBoundValue: null,
      upperBoundType: '$lte',
      lowerBoundValue: null,
      lowerBoundType: '$gte'
    };
  }

  /**
    * Are high precision values available?
    *
    * @returns {boolean} if high precision values are available.
    */
  static isHighPrecision() {
    return app.instance.build.version >= HP_VERSION;
  }

  static validateKeyAndValue(key, value) {
    if (!_.includes(['$gt', '$gte', '$lt', '$lte'], key)) {
      return false;
    }
    // Check that we have only numeric (or null) types.
    // String types are a possible extension,
    // but documents, arrays, BinData, undefined and other BSON types
    // make little sense http://bsonspec.org/spec.html
    if (typeof(value) !== 'number') {
      return false;
    }
    return !isNaN(value) && Math.abs(value) !== Infinity;
  }

  // static typeCastNumeric(value, serverVersion) {
  //   // Override serverVersion for testing, otherwise I'd mock isHighPrecision
  //   const highPrecision = (
  //       (typeof serverVersion === 'undefined' && RuleCategoryRange.isHighPrecision()) ||
  //       (serverVersion >= HP_VERSION)
  //   );
  //   const castableTypes = TypeChecker.castableTypes(value, highPrecision);
  //   // We rely on Double and Decimal128 being first in the list,
  //   // which is fragile and hence is unit tested
  //   return TypeChecker.cast(value, castableTypes[0]);
  // }

  static paramsToQuery(params) {
    const result = {};
    if (params.upperBoundType) {
      result[params.upperBoundType] = parseFloat(params.upperBoundValue, 10);
    }
    if (params.lowerBoundType) {
      result[params.lowerBoundType] = parseFloat(params.lowerBoundValue, 10);
    }
    return result;
  }

  static queryToParams(query) {
    // if not every key in the object is one of the comparison operators,
    // this rule cannot represent the query
    const keys = _.keys(query);
    if (!_.every(keys, (key) => {
      return RuleCategoryRange.validateKeyAndValue(key, query[key]);
    })) {
      return false;
    }
    const result = {
      upperBoundValue: null,
      upperBoundType: _.intersection(keys, ['$lte', '$lt']),
      lowerBoundValue: null,
      lowerBoundType: _.intersection(keys, ['$gte', '$gt'])
    };

    // Handle the 0 which is false-y case properly and convert to a String type
    if (_.isNumber(query.$lte)) {
      result.upperBoundValue = query.$lte.toString();
    }
    if (_.isNumber(query.$lt)) {
      result.upperBoundValue = query.$lt.toString();
    }
    if (_.isNumber(query.$gte)) {
      result.lowerBoundValue = query.$gte.toString();
    }
    if (_.isNumber(query.$gt)) {
      result.lowerBoundValue = query.$gt.toString();
    }

    if (result.upperBoundType.length > 1 || result.lowerBoundType.length > 1) {
      return false;
    }
    result.upperBoundType = result.upperBoundType[0] || null;
    result.lowerBoundType = result.lowerBoundType[0] || null;
    return result;
  }

  /**
   * checks if the children values (just the numeric values, not operators)
   * are valid together. We consider them invalid, if both bounds are "none",
   * or if the lower bound is not smaller than the upper bound.
   *
   * We consider them always valid if only one bound is set.
   *
   * @param {Number} lower      the lower bound value
   * @param {Number} upper      the upper bound value
   *
   * @return {Boolean}          whether the combined values are valid or not
   */
  validateCombinedValues(lower, upper) {
    // TODO Can't compare two Decimal128's for correctness easily in JS...
    // const highPrecision = false;

    // first check that not both values are "none"
    if (!upper && !lower) {
      return false;
    }
    // if only one value is "none", it's automatically valid
    if (!upper || !lower) {
      return true;
    }

    // const castedUpper = TypeChecker.cast(
    //   upper,
    //   TypeChecker.castableTypes(upper, highPrecision)[0]
    // );
    //
    // const castedLower = TypeChecker.cast(
    //   lower,
    //   TypeChecker.castableTypes(lower, highPrecision)[0]
    // );

    // only return true if the lower value strictly less than the upper value
    return parseFloat(lower, 10) < parseFloat(upper, 10);
  }

  /**
   * callback for child components (<RangeInput />) to be called when they
   * validate their own state. In this method, we only compute if all children
   * are individually valid. If they are not, we can immediately report up the
   * chain that this component is currently not valid. Otherwise, we have to
   * check the combined validity, which is done in `this.validateCombinedValues`.
   *
   * @param {String} key     The key of the child component: `lower` or `upper`
   * @param {Boolean} valid  The valid state of the child component
   */
  validate(key, valid) {
    if (key === undefined) {
      // downwards validation, call children's validate() method.
      this.refs.lowerBoundRangeInputChild.validate();
      this.refs.upperBoundRangeInputChild.validate();
      return;
    }
    this.childValidationStates[key] = valid;
    this.childrenIndividuallyValid = _.all(_.values(this.childValidationStates));

    if (!this.childrenIndividuallyValid) {
      this.props.validate(false);
    }
  }

  /**
   * Render ValidationHeader.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const validationState = (!this.isValid && this.childrenIndividuallyValid) ?
      'error' : null;
    return (
      <FormGroup>
        <RangeInput
            ref="lowerBoundRangeInputChild"
            boundIncluded={this.props.parameters.lowerBoundType === '$gte'}
            disabled={this.props.parameters.lowerBoundType === null}
            value={this.props.parameters.lowerBoundValue || ''}
            onRangeInputBlur={this.onRangeInputBlur.bind(this, 'lower')}
            validationState={validationState}
            validate={this.validate.bind(this, 'lower')}
        />
        <RangeInput
            ref="upperBoundRangeInputChild"
            upperBound
            boundIncluded={this.props.parameters.upperBoundType === '$lte'}
            disabled={this.props.parameters.upperBoundType === null}
            value={this.props.parameters.upperBoundValue || ''}
            onRangeInputBlur={this.onRangeInputBlur.bind(this, 'upper')}
            validationState={validationState}
            validate={this.validate.bind(this, 'upper')}
        />
      </FormGroup>
    );
  }
}

RuleCategoryRange.propTypes = {
  id: React.PropTypes.string.isRequired,
  parameters: React.PropTypes.object.isRequired,
  validate: React.PropTypes.func.isRequired
};

RuleCategoryRange.displayName = 'RuleCategoryRange';

module.exports = RuleCategoryRange;
