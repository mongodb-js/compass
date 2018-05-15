import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { OUT } from 'modules/pipeline';

import styles from './stage-preview-toolbar.less';

/**
 * The stage preview toolbar component.
 */
class StagePreviewToolbar extends PureComponent {
  static displayName = 'StagePreviewToolbar';
  static propTypes = {
    isEnabled: PropTypes.bool.isRequired,
    isValid: PropTypes.bool.isRequired,
    stageOperator: PropTypes.string,
    stageValue: PropTypes.any
  }

  /**
   * Get the stage preview text.
   *
   * @returns {String} The text.
   */
  getText() {
    if (this.props.isEnabled) {
      if (this.props.stageOperator) {
        if (this.props.stageOperator === OUT && this.props.isValid) {
          return `Documents will be saved to the collection: ${this.props.stageValue}`;
        }
        return `Sample of Documents after the ${this.props.stageOperator} stage`;
      }
      return '';
    }
    return 'Stage is disabled. Results not passed in the pipeline.';
  }

  /**
   * Renders the stage preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-preview-toolbar'])}>
        {this.getText()}
      </div>
    );
  }
}

export default StagePreviewToolbar;
