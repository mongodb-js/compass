const React = require('react');
const RuleFieldSelector = require('./rule-field-selector');
const RuleCategorySelector = require('./rule-category-selector');
const RuleDeleteButton = require('./rule-delete-button');
const ValidationActions = require('../actions');

const Form = require('react-bootstrap').Form;

const ruleCategories = require('./rule-categories');
const _ = require('lodash');

const debug = require('debug')('compass:validation:rule');

/**
 * Implements a single rule with RuleFieldSelector, RuleCategorySelector and
 * elements specific to the selected category.
 */
class Rule extends React.Component {

  checkBoxClicked() {
    ValidationActions.setRuleNullable(this.props.id, !this.props.nullable);
  }

  render() {
    debug('props', this.props);
    const Category = _.get(ruleCategories, this.props.category, null);
    const ruleParameters = Category ?
      <Category id={this.props.id} parameters={this.props.parameters} /> :
      null;

    const nullableDisabled = _.includes(['exists', 'mustNotExist'],
      this.props.category);

    return (
      <tr>
        <td>
          <RuleFieldSelector
            id={this.props.id}
            field={this.props.field}
          />
        </td>
        <td>
          <Form inline className="rule-category-form">
            <RuleCategorySelector
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
          <RuleDeleteButton id={this.props.id} />
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
