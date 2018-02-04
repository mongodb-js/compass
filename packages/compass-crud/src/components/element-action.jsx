import React from 'react';
import PropTypes from 'prop-types';
import RevertAction from 'components/revert-action';
import RemoveAction from 'components/remove-action';
import NoAction from 'components/no-action';

import classnames from 'classnames';
import styles from './element-action.less';

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
    const className = classnames(styles['element-action']);
    if (this.props.element.isRevertable()) {
      return (<RevertAction element={this.props.element} className={className} />);
    } else if (this.props.element.isNotActionable()) {
      return (<NoAction element={this.props.element} className={className} />);
    }
    return (<RemoveAction element={this.props.element} className={className} />);
  }
}

ElementAction.displayName = 'ElementAction';

ElementAction.propTypes = {
  element: PropTypes.object.isRequired
};

export default ElementAction;
