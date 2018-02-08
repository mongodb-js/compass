import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputCollapser from 'components/input-collapser';

import styles from './input-builder-toolbar.less';

/**
 * The input builder toolbar component.
 */
class InputBuilderToolbar extends PureComponent {
  static displayName = 'InputBuilderToolbar';

  static propTypes = {
    inputCollapseToggled: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    count: PropTypes.number.isRequired
  }

  /**
   * Renders the input builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const iconClassName = classnames({
      'fa': true,
      'fa-database': true,
      [ styles['input-builder-toolbar-db'] ]: true
    });
    return (
      <div className={classnames(styles['input-builder-toolbar'])}>
        <InputCollapser
          inputCollapseToggled={this.props.inputCollapseToggled}
          isExpanded={this.props.isExpanded} />
        <i className={iconClassName} aria-hidden />
        <div className={classnames(styles['input-builder-toolbar-count'])}>
          {this.props.count} Input Documents
        </div>
      </div>
    );
  }
}

export default InputBuilderToolbar;
