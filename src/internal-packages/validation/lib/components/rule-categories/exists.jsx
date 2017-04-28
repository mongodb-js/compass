const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:validation:exists');

class RuleCategoryExists extends React.Component {

  /**
   * get the initial parameters for this rule category.
   *
   * @return {Object}   the parameters for this rule.
   */
  static getInitialParameters() {
    return {};
  }

  /**
   * Convert the parameters describing the state of this rule to a query
   * value that MongoDB understands.
   *
   * @return {Object}   the value describing this rule.
   */
  static paramsToQuery() {
    return {
      $exists: true
    };
  }

  /**
   * Convert the a query value returned from the server to an object of
   * parameters describing the state of this rule.
   *
   * @param {Object} query   The query value for this field.
   *
   * @return {Object|Boolean}  the parameters describing the state of this rule
   *                           or false if the query cannot be described by
   *                           this rule.
   */
  static queryToParams(query) {
    if (_.isEqual(query, {$exists: true})) {
      return {};
    }
    return false;
  }

  /**
   * Render ValidationHeader.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    // nothing to render for the "Exists" rule.
    return null;
  }
}

RuleCategoryExists.propTypes = {
  id: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired
};

RuleCategoryExists.displayName = 'RuleCategoryExists';

module.exports = RuleCategoryExists;
