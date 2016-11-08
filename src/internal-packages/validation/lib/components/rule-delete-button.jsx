const React = require('react');
const Button = require('react-bootstrap').Button;
const FontAwesome = require('react-fontawesome');

/**
 * A delete button for each rule to remove the rule.
 */
class RuleDeleteButton extends React.Component {

  /**
   * Render RuleDeleteButton
   *
   * @returns {React.Component} The view component.
   */
  render() {
    return (
      <Button className="delete-button pull-right" onClick={this.props.onClick}>
        <FontAwesome name="trash-o" />
      </Button>
    );
  }
}

RuleDeleteButton.propTypes = {
  id: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func.isRequired
};

RuleDeleteButton.displayName = 'RuleDeleteButton';

module.exports = RuleDeleteButton;
