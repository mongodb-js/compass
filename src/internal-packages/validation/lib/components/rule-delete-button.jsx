const React = require('react');
const ValidationActions = require('../actions');
const Button = require('react-bootstrap').Button;
const FontAwesome = require('react-fontawesome');

/**
 * A delete button for each rule to remove the rule.
 */
class RuleDeleteButton extends React.Component {

  onDeleteClicked() {
    ValidationActions.deleteValidationRule(this.props.id);
  }

  /**
   * Render RuleDeleteButton
   *
   * @returns {React.Component} The view component.
   */
  render() {
    return (
      <Button className="delete-button pull-right" onClick={this.onDeleteClicked.bind(this)}>
        <FontAwesome name="trash-o" />
      </Button>
    );
  }
}

RuleDeleteButton.propTypes = {
  id: React.PropTypes.string.isRequired
};

RuleDeleteButton.displayName = 'RuleDeleteButton';

module.exports = RuleDeleteButton;
