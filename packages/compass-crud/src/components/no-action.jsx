const React = require('react');

/**
 * The actions class.
 */
const ACTIONS = 'editable-element-actions';

/**
 * General element action component.
 */
class NoAction extends React.Component {

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <div className={ACTIONS}></div>
    );
  }
}

NoAction.displayName = 'NoAction';

module.exports = NoAction;
