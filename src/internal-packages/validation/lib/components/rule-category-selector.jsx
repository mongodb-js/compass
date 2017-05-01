const React = require('react');
const PropTypes = require('prop-types');
const ValidationActions = require('../actions');
const ruleCategories = require('./rule-categories');
const { FormGroup } = require('react-bootstrap');
const { OptionSelector } = require('hadron-react-components');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:validation:rule-category');

/**
 * This component is a dropdown to choose one of the rules defined under
 * ./rule-categories.
 */
class RuleCategorySelector extends React.Component {

  /**
   * constructor sets the initial state.
   *
   * @param {Object} props   initial props, passed to super class.
   */
  constructor(props) {
    super(props);
    this.state = {
      hasStartedValidating: false,
      isValid: true,
      category: props.category || ''
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      category: props.category || ''
    });
  }

  onSelect(category) {
    this.setState({
      category: category,
      isValid: true,
      hasStartedValidating: true
    });
    ValidationActions.setRuleCategory(this.props.id, category);
  }

  validate(force) {
    if (!force && !this.state.hasStartedValidating) {
      return true;
    }
    const isValid = this.state.category !== '';
    this.setState({
      hasStartedValidating: true,
      isValid: isValid
    });
    return isValid;
  }

  /**
   * Render RuleCategorySelector
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const dropdownOptions = _.zipObject(
      _.keys(ruleCategories),
      _.map(_.keys(ruleCategories), _.startCase)
    );

    const validationState = this.state.isValid ? null : 'error';

    return (
      <FormGroup validationState={validationState}>
        <OptionSelector
          options={dropdownOptions}
          id={this.props.id}
          label=""
          title={dropdownOptions[this.state.category] || 'Select rule category'}
          onSelect={this.onSelect.bind(this)}
          disabled={!this.props.isWritable}
        />
      </FormGroup>
    );
  }
}

RuleCategorySelector.propTypes = {
  id: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  isWritable: PropTypes.bool
};

RuleCategorySelector.displayName = 'RuleCategorySelector';

module.exports = RuleCategorySelector;
