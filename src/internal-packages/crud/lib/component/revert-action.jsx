'use strict';

const React = require('react');

/**
 * The actions class.
 */
const ACTIONS = 'actions';

/**
 * General element action component.
 */
class RevertAction extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
  }

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={ACTIONS} onClick={this.handleClick.bind(this)}>
        <i className='fa fa-rotate-left' aria-hidden={true} />
      </div>
    );
  }

  /**
   * Revert the change.
   */
  handleClick() {
    this.element.revert();
  }
}

RevertAction.displayName = 'RevertAction';

module.exports = RevertAction;
