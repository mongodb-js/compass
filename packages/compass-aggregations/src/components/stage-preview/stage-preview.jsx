import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './stage-preview.less';

/**
 * The stage preview component.
 */
class StagePreview extends PureComponent {
  static displayName = 'StagePreview';
  static propTypes = {
    stage: PropTypes.object.isRequired
  }

  renderError() {
    if (this.props.stage.isValid) {
      return null;
    }
    return (
      <div className={classnames(styles['stage-preview-invalid'])}>
        <i>Error: No Preview Document</i>
      </div>
    );
  }

  /**
   * Renders the stage preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const iconClassName = classnames({
      'fa': true,
      'fa-angle-double-right': true,
      [ styles['stage-preview-arrow'] ]: true
    });
    return (
      <div className={classnames(styles['stage-preview'])}>
        <i className={iconClassName} aria-hidden />
        {this.renderError()}
      </div>
    );
  }
}

export default StagePreview;
