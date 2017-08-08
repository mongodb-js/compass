const React = require('react');
const PropTypes = require('prop-types');
const RevertAction = require('./revert-action');
const RemoveAction = require('./remove-action');
const NoAction = require('./no-action');

/**
 * Component to render the available action for an element.
 */
class ElementAction extends React.Component {

  /**
   * Render the action available for the element.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (this.props.element.isRevertable()) {
      return (<RevertAction element={this.props.element} />);
    } else if (this.props.element.isNotActionable()) {
      return (<NoAction element={this.props.element} />);
    }
    return (<RemoveAction element={this.props.element} />);
  }
}

ElementAction.displayName = 'ElementAction';

ElementAction.propTypes = {
  element: PropTypes.object.isRequired
};

module.exports = ElementAction;
