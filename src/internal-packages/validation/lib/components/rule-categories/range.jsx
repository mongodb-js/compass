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

  static queryToParams(query) {
    // if not every key in the object is one of the comparison operators,
    // this rule cannot represent the query
    const keys = _.keys(query);
    if (!_.every(keys, (key) => {
      return _.contains(['$gt', '$gte', '$lt', '$lte'], key);
    })) {
      return false;
    }
    const result = {
      upperBoundValue: query.$lte || query.$lt || null,
      upperBoundType: _.intersection(keys, ['$lte', '$lt']),
      lowerBoundValue: query.$gte || query.$gt || null,
      lowerBoundType: _.intersection(keys, ['$gte', '$gt'])
    };

    if (result.upperBoundType.length === 0) {
      result.upperBoundType = null;
    }
    if (result.lowerBoundType.length === 0) {
      result.lowerBoundType = null;
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
