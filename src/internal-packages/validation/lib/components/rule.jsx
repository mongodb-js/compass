const React = require('react');
const PropTypes = require('prop-types');
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
      (<Parameters
        ref="Parameters"
        id={this.props.id}
        serverVersion={this.props.serverVersion}
        parameters={this.props.parameters}
        isWritable={this.props.isWritable}
      />) : null;

    const nullableDisabled = _.includes(['exists', 'mustNotExist', ''],
      this.props.category);

    return (
      <tr>
        <td>
          <RuleFieldSelector
            ref="RuleFieldSelector"
            id={this.props.id}
            field={this.props.field}
            isWritable={this.props.isWritable}
          />
        </td>
        <td>
          <Form inline className="rule-category-form">
            <RuleCategorySelector
              ref="RuleCategorySelector"
              id={this.props.id}
              category={this.props.category}
              isWritable={this.props.isWritable}
            />
            {ruleParameters}
          </Form>
        </td>
        <td>
          <input
            className="nullable"
            type="checkbox"
            checked={this.props.nullable}
            disabled={nullableDisabled || !this.props.isWritable}
            onChange={this.checkBoxClicked.bind(this)}/></td>
        <td>
          {this.props.isWritable ? (<RuleDeleteButton
            id={this.props.id}
            onClick={this.onDeleteClicked.bind(this)} />) : null}
        </td>
      </tr>
    );
  }
}

Rule.propTypes = {
  id: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  parameters: PropTypes.object.isRequired,
  nullable: PropTypes.bool.isRequired,
  serverVersion: PropTypes.string.isRequired,
  isWritable: PropTypes.bool.isRequired
};

Rule.displayName = 'Rule';

module.exports = Rule;
