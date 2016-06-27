'use strict';

const React = require('react');

/**
 * Component for the clone document button.
 */
class CloneDocumentButton extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the button.
   *
   * @returns {Component} The button component.
   */
  render() {
    return (
      <button type='button' className="btn btn-default btn-xs" onClick={this.props.handler} title='Clone Document'>
        <i className="fa fa-clone" aria-hidden="true"></i>
      </button>
    );
  }

  /**
   * Never needs to re-render.
   */
  shouldComponentUpdate() {
    return false;
  }
}

CloneDocumentButton.displayName = 'CloneDocumentButton';

module.exports = CloneDocumentButton;
