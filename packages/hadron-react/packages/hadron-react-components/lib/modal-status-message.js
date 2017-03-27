const React = require('react');
const Panel = require('react-bootstrap').Panel;

/**
 * Component for the status message.
 */
class ModalStatusMessage extends React.Component {

  /**
   * Render the status message.
   *
   * @returns {React.Component} The status message component.
   */
  render() {
    // prefix for class names for css styling
    const classPrefix = `modal-status-${this.props.type}`;
    return React.createElement(
      Panel,
      { className: classPrefix },
      React.createElement(
        'div',
        { className: 'row' },
        React.createElement(
          'div',
          { className: 'col-md-1' },
          React.createElement('i', {
            className: `fa fa-${this.props.icon} ${classPrefix}-icon`,
            'aria-hidden': 'true' })
        ),
        React.createElement(
          'div',
          { className: 'col-md-11' },
          React.createElement(
            'p',
            {
              className: `${classPrefix}-message`, 'data-test-id': 'modal-message' },
            this.props.message
          )
        )
      )
    );
  }
}

ModalStatusMessage.displayName = 'ModalStatusMessage';

ModalStatusMessage.propTypes = {
  icon: React.PropTypes.string.isRequired,
  message: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired
};

module.exports = ModalStatusMessage;