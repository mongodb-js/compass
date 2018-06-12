import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Switch from 'react-ios-switch';

import styles from './pipeline-preview-toolbar.less';

/**
 * The pipeline preview toolbar component.
 */
class PipelinePreviewToolbar extends PureComponent {
  static displayName = 'PipelinePreviewToolbarComponent';

  static propTypes = {
    toggleComments: PropTypes.func.isRequired,
    toggleSample: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isSampling: PropTypes.bool.isRequired,
    isModified: PropTypes.bool.isRequired
  }

  modifiedText() {
    if (this.props.isModified) {
      return (
        <div className={classnames(styles['pipeline-preview-toolbar-indicator-text'])}>
          Unsaved changes
        </div>
      );
    }
  }

  /**
   * Renders the pipeline preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const isModifiedClassName = classnames({
      [ styles['pipeline-preview-toolbar-indicator'] ]: true,
      [ styles['pipeline-preview-toolbar-indicator-is-modified'] ]: this.props.isModified
    });
    return (
      <div className={classnames(styles['pipeline-preview-toolbar'])}>
        <div className={classnames(styles['pipeline-preview-toolbar-toggle-comments'])}>
          <Switch
            checked={this.props.isCommenting}
            onChange={this.props.toggleComments}
            className={classnames(styles['pipeline-preview-toolbar-toggle-comments-button'])} />
        </div>
        <div className={classnames(styles['pipeline-preview-toolbar-comment-mode'])}>
          Comment Mode
        </div>
        <div className={classnames(styles['pipeline-preview-toolbar-toggle-sample'])}>
          <Switch
            checked={this.props.isSampling}
            onChange={this.props.toggleSample}
            className={classnames(styles['pipeline-preview-toolbar-toggle-sample-button'])} />
        </div>
        <div className={classnames(styles['pipeline-preview-toolbar-sample-mode'])}>
          Sample Mode
        </div>
        <div className={isModifiedClassName}>
          {this.modifiedText()}
          <i className="fa fa-circle" aria-hidden />
        </div>
      </div>
    );
  }
}

export default PipelinePreviewToolbar;
