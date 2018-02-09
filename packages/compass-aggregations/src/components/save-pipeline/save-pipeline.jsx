import styles from './save-pipeline.less';
import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

class SavePipeline extends Component {
  static displayName = 'SavePipelineComponent';

  static propTypes = {
    closeSavedPipelines: PropTypes.func.isRequired
  }

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['save-pipeline'])}>
        <div className={classnames(styles['save-pipeline-header'])}>
          <div>Saved Pipelines</div>
          <div className="fa fa-times" onClick={this.props.closeSavedPipelines}></div>
        </div>
      </div>
    );
  }
}

export default SavePipeline;
