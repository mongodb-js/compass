import React from 'react';
import PropTypes from 'prop-types';

/**
 * The actions class.
 */
const ACTIONS = 'editable-element-actions';

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
   * Revert the change.
   */
  handleClick() {
    this.element.revert();
  }

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={ACTIONS} onClick={this.handleClick.bind(this)}>
        <i className="fa fa-rotate-left" aria-hidden />
      </div>
    );
  }
}

RevertAction.displayName = 'RevertAction';

RevertAction.propTypes = {
  element: PropTypes.object.isRequired
};

export default RevertAction;
