const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const ValidationAction = require('../../actions');
const RangeInput = require('../common/range-input');
const bootstrap = require('react-bootstrap');
const FormGroup = bootstrap.FormGroup;

// const debug = require('debug')('mongodb-compass:validation:range');

class RuleCategoryRange extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isValid: true,
      combinedValid: true,
      parameters: _.clone(this.props.parameters)
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      parameters: _.clone(props.parameters)
    });
  }

  /**
   * callback called by the child components (<RangeInput />) whenever
   * they change their value or operator. This method then updates the
   * internal `state.parameters` accordingly.
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
    ValidationAction.setRuleParameters(this.props.id, params);
  }

  static getInitialParameters() {
    return {
      upperBoundValue: '',
      upperBoundType: '$lte',
      lowerBoundValue: '',
      lowerBoundType: '$gte'
    };
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
  validateCombinedValues() {
    const {
      upperBoundType,
      upperBoundValue,
      lowerBoundType,
      lowerBoundValue
    } = this.state.parameters;

    // first check that not both values are "none"
    if (!upperBoundType && !lowerBoundType) {
      return false;
    }
    // if only one value is "none", it's automatically valid
    if (!upperBoundType || !lowerBoundType) {
      return true;
    }

    // if one of the fields is still empty, don't invalidate here. The
    // RangeInput component will take care of this case.
    if (upperBoundValue === '' || lowerBoundValue === '') {
      return true;
    }

    // if either of the children don't validate, return true here as that
    // case is handled in the children directly, and we're not invalidating
    // both children if just one is invalid.
    if (!_.result(this.refs.lower, 'validate', false) ||
        !_.result(this.refs.upper, 'validate', false)) {
      return true;
    }

    // only return true if the lower value strictly less than the upper value
    return parseFloat(lowerBoundValue, 10) < parseFloat(upperBoundValue, 10);
  }

  validate(force) {
    // if (!force && !this.state.hasStartedValidating) {
    //   return true;
    // }
    const lowerValid = this.refs.lower.validate(force);
    const upperValid = this.refs.upper.validate(force);
    const combinedValid = this.validateCombinedValues();
    const isValid = lowerValid && upperValid && combinedValid;
    this.setState({
      isValid: isValid,
      combinedValid: combinedValid
    });
    return isValid;
  }

  /**
   * Render ValidationHeader.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const validationState = this.state.combinedValid ? null : 'error';
    return (
      <FormGroup>
        <RangeInput
            ref="lower"
            boundIncluded={this.props.parameters.lowerBoundType === '$gte'}
            hidden={this.props.parameters.lowerBoundType === null}
            disabled={!this.props.isWritable}
            value={this.props.parameters.lowerBoundValue || ''}
            onRangeInputBlur={this.onRangeInputBlur.bind(this, 'lower')}
            validationState={validationState}
        />
        <RangeInput
            ref="upper"
            upperBound
            boundIncluded={this.props.parameters.upperBoundType === '$lte'}
            hidden={this.props.parameters.upperBoundType === null}
            disabled={!this.props.isWritable}
            value={this.props.parameters.upperBoundValue || ''}
            onRangeInputBlur={this.onRangeInputBlur.bind(this, 'upper')}
            validationState={validationState}
        />
      </FormGroup>
    );
  }
}

RuleCategoryRange.propTypes = {
  id: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired,
  isWritable: PropTypes.bool.isRequired
};

RuleCategoryRange.displayName = 'RuleCategoryRange';

module.exports = RuleCategoryRange;
