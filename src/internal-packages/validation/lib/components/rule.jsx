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

  constructor(props) {
    super(props);

    this.state = {
      isValid: true,
      childValidationStates: {
        RuleFieldSelector: true,
        RuleCategorySelector: true
      }
    };
  }

  checkBoxClicked() {
    ValidationActions.setRuleNullable(this.props.id, !this.props.nullable);
  }

  /**
   * called by child components when they evaluate if they are valid.
   * This method saves the valid state for each child, and then determine
   * if itself is valid. This is only the case when all children are valid.
   * It then reports its own state up the chain by calling this.props.validate().
   *
   * @param {String} key      an identifier string for the child component
   * @param {Boolean} valid   whether the child was valid or not
   */
  validate(key, valid) {
    const childValidationStates = _.clone(this.state.childValidationStates);
    childValidationStates[key] = valid;
    const isValid = _.all(_.values(childValidationStates));
    this.setState({
      childValidationStates: childValidationStates,
      isValid: isValid
    });
    this.props.validate(isValid);
  }

  render() {
    const Category = _.get(ruleCategories, this.props.category, null);
    const ruleParameters = Category ?
      <Category
        id={this.props.id}
        parameters={this.props.parameters}
        validate={this.validate.bind(this, 'Category')}
      /> :
      null;

    const nullableDisabled = _.includes(['exists', 'mustNotExist'],
      this.props.category);

    return (
      <tr>
        <td>
          <RuleFieldSelector
            id={this.props.id}
            field={this.props.field}
            validate={this.validate.bind(this, 'RuleFieldSelector')}
          />
        </td>
        <td>
          <Form inline className="rule-category-form">
            <RuleCategorySelector
              id={this.props.id}
              category={this.props.category}
              validate={this.validate.bind(this, 'RuleCategorySelector')}
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
  nullable: React.PropTypes.bool.isRequired,
  validate: React.PropTypes.func
};

Rule.displayName = 'Rule';

module.exports = Rule;
