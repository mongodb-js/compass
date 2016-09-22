const React = require('react');

/**
 * The actions class.
 */
const ACTIONS = 'actions';

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
      <div className={ACTIONS} onClick={this.handleClick.bind(this)}>
        <i className="fa fa-times-circle" aria-hidden />
      </div>
    );
  }
}

RemoveAction.displayName = 'RemoveAction';

RemoveAction.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = RemoveAction;
