const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');

// import dbg from 'debug';
// const debug = dbg('mongodb-compass:validation:exists');

class RuleCategoryMustNotExist extends React.Component {

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
      $exists: false
    };
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
    if (_.isEqual(query, {$exists: false})) {
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
    return null;
  }
}

RuleCategoryMustNotExist.propTypes = {
  id: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired
};

RuleCategoryMustNotExist.displayName = 'RuleCategoryMustNotExist';

module.exports = RuleCategoryMustNotExist;
