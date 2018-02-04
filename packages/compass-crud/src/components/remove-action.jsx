import React from 'react';
import PropTypes from 'prop-types';

/**
 * General element action component.
 */
class RemoveAction extends React.Component {

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
   * Remove the change.
   */
  handleClick() {
    this.element.remove();
  }

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={this.props.className} onClick={this.handleClick.bind(this)}>
        <i className="fa fa-times-circle" aria-hidden />
      </div>
    );
  }
}

RemoveAction.displayName = 'RemoveAction';

RemoveAction.propTypes = {
  element: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired
};

export default RemoveAction;
