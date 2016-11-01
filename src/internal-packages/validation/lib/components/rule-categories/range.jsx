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

  onRangeInputBlur() {
    const opMap = {
      '>=': '$gte',
      '>': '$gt',
      '<=': '$lte',
      '<': '$lt'
    };
    const params = RuleCategoryRange.getInitialParameters();
    // Use refs to get child state, as children don't have a unique ID
    // http://stackoverflow.com/a/29303324
    const lowerBoundState = this.refs.lowerBoundRangeInputChild.state;
    const upperBoundState = this.refs.upperBoundRangeInputChild.state;
    if (Object.keys(opMap).includes(lowerBoundState.operator)) {
      params.lowerBoundType = opMap[lowerBoundState.operator];
      params.lowerBoundValue = lowerBoundState.value;
    } else {
      params.lowerBoundType = null;
    }
    if (Object.keys(opMap).includes(upperBoundState.operator)) {
      params.upperBoundType = opMap[upperBoundState.operator];
      params.upperBoundValue = upperBoundState.value;
    } else {
      params.upperBoundType = null;
    }
    params.comboValidationState = RuleCategoryRange.getComboValidationState(params);

    // Trigger an action that should update the Reflux ValidationStore
    ValidationAction.setRuleParameters(this.props.id, params);
  }

  static getInitialParameters() {
    return {
      upperBoundValue: null,
      upperBoundType: '$lte',
      lowerBoundValue: null,
      lowerBoundType: '$gte'
    };
  }

  static getComboValidationState(params) {
    // No documents could possibly satisfy these cases, e.g. 5 <= value < 5
    if (params.upperBoundValue !== null &&
        params.lowerBoundValue !== null &&
        TypeChecker.cast(
          params.upperBoundValue,
          TypeChecker.castableTypes(params.upperBoundValue)[0]
        )
        <=
        TypeChecker.cast(
          params.lowerBoundValue,
          TypeChecker.castableTypes(params.lowerBoundValue)[0]
        )
    ) {
      return 'error';
    }
    return null;
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

  static typeCastNumeric(value, serverVersion) {
    // Override serverVersion for testing, otherwise I'd mock isHighPrecision
    const highPrecision = (
        (typeof serverVersion === 'undefined' && RuleCategoryRange.isHighPrecision()) ||
        (serverVersion >= HP_VERSION)
    );
    const castableTypes = TypeChecker.castableTypes(value, highPrecision);
    // We rely on Double and Decimal128 being first in the list,
    // which is fragile and hence is unit tested
    return TypeChecker.cast(value, castableTypes[0]);
  }

  static paramsToQuery(params) {
    const result = {};
    if (params.upperBoundType) {
      result[params.upperBoundType] = RuleCategoryRange.typeCastNumeric(params.upperBoundValue);
    }
    if (params.lowerBoundType) {
      result[params.lowerBoundType] = RuleCategoryRange.typeCastNumeric(params.lowerBoundValue);
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
      comboValidationState: null,
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
    result.comboValidationState = RuleCategoryRange.getComboValidationState(result);
    return result;
  }

  /**
   * Render ValidationHeader.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    return (
      <FormGroup>
        <RangeInput
            ref="lowerBoundRangeInputChild"
            boundIncluded={this.props.parameters.lowerBoundType === '$gte'}
            disabled={this.props.parameters.lowerBoundType === null}
            value={this.props.parameters.lowerBoundValue}
            onRangeInputBlur={this.onRangeInputBlur.bind(this)}
            validationState={this.props.parameters.comboValidationState}
        />
        <RangeInput
            ref="upperBoundRangeInputChild"
            upperBound
            boundIncluded={this.props.parameters.upperBoundType === '$lte'}
            disabled={this.props.parameters.upperBoundType === null}
            value={this.props.parameters.upperBoundValue}
            onRangeInputBlur={this.onRangeInputBlur.bind(this)}
            validationState={this.props.parameters.comboValidationState}
        />
      </FormGroup>
    );
  }
}

RuleCategoryRange.propTypes = {
  id: React.PropTypes.string.isRequired,
  parameters: React.PropTypes.object.isRequired
};

RuleCategoryRange.displayName = 'RuleCategoryRange';

module.exports = RuleCategoryRange;
