const React = require('react');
const OptionSelector = require('./common/option-selector');
const ValidationActions = require('../actions');
const ruleCategories = require('./rule-categories');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:validation:rule-category');

/**
 * This component is a dropdown to choose one of the rules defined under
 * ./rule-categories.
 */
class RuleCategorySelector extends React.Component {

  onSelect(category) {
    if (this.validate(category)) {
      ValidationActions.setRuleCategory(this.props.id, category);
    }
  }

  validate(category) {
    const isValid = category !== '';
    this.props.validate(isValid);
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

    return (
      <OptionSelector
        options={dropdownOptions}
        id={this.props.id}
        label=""
        value={this.props.category}
        onSelect={this.onSelect.bind(this)}
      />
    );
  }
}

RuleCategorySelector.propTypes = {
  id: React.PropTypes.string.isRequired,
  category: React.PropTypes.string.isRequired,
  validate: React.PropTypes.func
};

RuleCategorySelector.displayName = 'RuleCategorySelector';

module.exports = RuleCategorySelector;
