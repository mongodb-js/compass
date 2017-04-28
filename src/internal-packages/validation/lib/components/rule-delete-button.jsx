const React = require('react');
const PropTypes = require('prop-types');
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
      <Button className="delete-button pull-right" bsSize="sm" onClick={this.props.onClick}>
        <FontAwesome name="trash-o" />
      </Button>
    );
  }
}

RuleDeleteButton.propTypes = {
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

RuleDeleteButton.displayName = 'RuleDeleteButton';

module.exports = RuleDeleteButton;
