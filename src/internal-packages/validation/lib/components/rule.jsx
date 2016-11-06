const React = require('react');
const RuleFieldSelector = require('./rule-field-selector');
const RuleCategorySelector = require('./rule-category-selector');
const RuleDeleteButton = require('./rule-delete-button');
const ValidationActions = require('../actions');

const Form = require('react-bootstrap').Form;

const ruleCategories = require('./rule-categories');
const _ = require('lodash');

// const debug = require('debug')('compass:validation:rule');

/**
 * Implements a single rule with RuleFieldSelector, RuleCategorySelector and
 * elements specific to the selected category.
 */
class Rule extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isValid: true
    };
  }

  onDeleteClicked() {
    ValidationActions.deleteValidationRule(this.props.id);
  }

  checkBoxClicked() {
    ValidationActions.setRuleNullable(this.props.id, !this.props.nullable);
  }

  /**
   * validates all children components and combines the result for its own
   * isValid state.
   * @param  {Boolean} force    force validation (before submit)
   * @return {Boolean}          whether or not it valid inputs.
   */
  validate(force) {
    const fieldValid = this.refs.RuleFieldSelector.validate(force);
    const categoryValid = this.refs.RuleCategorySelector.validate(force);

    let isValid = fieldValid && categoryValid;
    if (this.refs.Parameters && this.refs.Parameters.validate) {
      isValid = isValid && this.refs.Parameters.validate(force);
    }

    this.setState({
      isValid: isValid
    });
    return isValid;
  }

  render() {
    const Parameters = _.get(ruleCategories, this.props.category, null);
    const ruleParameters = Parameters ?
      <Parameters
        ref="Parameters"
        id={this.props.id}
        parameters={this.props.parameters}
      /> : null;

    const nullableDisabled = _.includes(['exists', 'mustNotExist', ''],
      this.props.category);

    return (
      <tr>
        <td>
          <RuleFieldSelector
            ref="RuleFieldSelector"
            id={this.props.id}
            field={this.props.field}
          />
        </td>
        <td>
          <Form inline className="rule-category-form">
            <RuleCategorySelector
              ref="RuleCategorySelector"
              id={this.props.id}
              category={this.props.category}
            />
            {ruleParameters}
          </Form>
        </td>
        <td>
          <input
            className="nullable"
            type="checkbox"
            checked={this.props.nullable}
            disabled={nullableDisabled}
            onChange={this.checkBoxClicked.bind(this)}/></td>
        <td>
          <RuleDeleteButton
            id={this.props.id}
            onClick={this.onDeleteClicked.bind(this)} />
        </td>
      </tr>
    );
  }
}

Rule.propTypes = {
  id: React.PropTypes.string.isRequired,
  field: React.PropTypes.string.isRequired,
  category: React.PropTypes.string.isRequired,
  parameters: React.PropTypes.object.isRequired,
  nullable: React.PropTypes.bool.isRequired
};

Rule.displayName = 'Rule';

module.exports = Rule;
