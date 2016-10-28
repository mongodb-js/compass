const React = require('react');
const _ = require('lodash');
const ValidationAction = require('../../actions');
const RangeInput = require('../common/range-input');
const bootstrap = require('react-bootstrap');
const FormGroup = bootstrap.FormGroup;

// const debug = require('debug')('mongodb-compass:validation');

class RuleCategoryRange extends React.Component {

  onBoundOpChanged(eventKey) {
    const params = this.props.parameters;
    switch (eventKey) {
      case '$lte': // fall through
      case '$lt': params.upperBoundType = eventKey; break;
      case '$gte': // fall through
      case '$gt': params.lowerBoundType = eventKey; break;
      case 'none-upper': params.upperBoundType = null; break;
      case 'none-lower': params.lowerBoundType = null; break;
      default: break;
    }
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

  static paramsToQuery(params) {
    const result = {};
    if (params.upperBoundType !== null) {
      result[params.upperBoundType] = params.upperBoundValue;
    }
    if (params.lowerBoundType !== null) {
      result[params.lowerBoundType] = params.lowerBoundValue;
    }
    return result;
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
    return !isNaN(value);
  }

  static queryToParams(query) {
    /* eslint complexity: 0 */ // @todo break into smaller functions
    // if not every key in the object is one of the comparison operators,
    // this rule cannot represent the query
    const keys = _.keys(query);
    if (!_.every(keys, (key) => {
      return RuleCategoryRange.validateKeyAndValue(key, query[key]);
    })) {
      return false;
    }
    const result = {
      upperBoundValue: query.$lte || query.$lt || null,
      upperBoundType: _.intersection(keys, ['$lte', '$lt']),
      lowerBoundValue: query.$gte || query.$gt || null,
      lowerBoundType: _.intersection(keys, ['$gte', '$gt'])
    };
    if (result.upperBoundType.length > 1 || result.lowerBoundType.length > 1) {
      return false;
    }
    result.upperBoundType = result.upperBoundType[0] || null;
    result.lowerBoundType = result.lowerBoundType[0] || null;

    // No documents could possibly satisfy these cases, e.g. 5 <= value < 5
    if (typeof(result.upperBoundValue) === 'number' &&
        typeof(result.lowerBoundValue) === 'number') {
      if (result.upperBoundValue <= result.lowerBoundValue) {
        return false;
      }
    }
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
        <RangeInput />
        <RangeInput upperBound/>
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
