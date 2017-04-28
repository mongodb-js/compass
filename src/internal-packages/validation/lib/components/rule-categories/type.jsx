const React = require('react');
const PropTypes = require('prop-types');
const ValidationAction = require('../../actions');
const BSONTypeSelector = require('../common/bson-type-selector');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:validation');

class RuleCategoryType extends React.Component {

  onTypeClicked(type, evt) {
    evt.preventDefault();
    ValidationAction.setRuleParameters(this.props.id, {
      type: type.number
    });
  }

  /**
   * get the initial parameters for this rule category.
   *
   * @return {Object}   the parameters for this rule.
   */
  static getInitialParameters() {
    return {
      type: 1
    };
  }

  /**
   * Convert the parameters describing the state of this rule to a query
   * value that MongoDB understands.
   *
   * @param {Object} params   the parameters describing the state of this rule
   *
   * @return {Object}   the value describing this rule.
   */
  static paramsToQuery(params) {
    if (_.has(params, 'type')) {
      return {
        $type: _.get(params, 'type')
      };
    }
    return false;
  }

  /**
   * Detect if a query can be represented by this rule, and if it can,
   * convert the a query value returned from the server to an object of
   * parameters describing the state of this rule.
   *
   * @param {Object} query   The query value for this field.
   *
   * @return {Object|Boolean}  the parameters describing the state of this rule
   *                           or false if the query cannot be described by
   *                           this rule.
   */
  static queryToParams(query) {
    if (_.isEqual(_.keys(query), ['$type'])) {
      // if $type is number, use directly
      if (_.isNumber(query.$type)) {
        return {type: query.$type};
      }
      // if $type is string, assume alias and try to get a type
      if (_.isString(query.$type)) {
        const type = BSONTypeSelector.getTypeByAlias(query.$type);
        if (type) {
          return {type: type.number};
        }
      }
    }
    // in all other cases, this rule cannot represent the query
    return false;
  }

  /**
   * Render TypeParameters component.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const typeNumber = this.props.parameters.type;

    return (
      <BSONTypeSelector
        typeNumber={typeNumber}
        serverVersion={this.props.serverVersion}
        isDisabled={!this.props.isWritable}
        onTypeClicked={this.onTypeClicked.bind(this)} />
    );
  }
}

RuleCategoryType.propTypes = {
  id: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired,
  serverVersion: PropTypes.string.isRequired,
  isWritable: PropTypes.bool.isRequired
};

RuleCategoryType.displayName = 'RuleCategoryType';

module.exports = RuleCategoryType;
