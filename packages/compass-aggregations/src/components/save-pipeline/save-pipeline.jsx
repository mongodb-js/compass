import React, { Component } from 'react';
import { IconButton } from 'hadron-react-buttons';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import SavePipelineCard from 'components/save-pipeline-card';
import styles from './save-pipeline.less';

class SavePipeline extends Component {
  static displayName = 'SavePipelineComponent';

  static propTypes = {
    savedPipelinesListToggle: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired
  }

  handleSavedPipelinesClose = () => {
    this.props.savedPipelinesListToggle(0);
  };

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const pipelines = this.props.savedPipeline.pipelines.map((pipeline, i) => {
      return (
        <SavePipelineCard
          {...this.props}
          name={pipeline.name}
          objectID={pipeline.id}
          key={i}/>
      );
    });

    return (
      <div className={classnames(styles['save-pipeline'])}>
        <div className={classnames(styles['save-pipeline-header'])}>
          <div id="saved-pipeline-header-title">Saved Pipelines</div>
          <IconButton
            title="Close Saved Pipelines"
            className="btn btn-xs btn-default"
            iconClassName="fa fa-times"
            clickHandler={this.handleSavedPipelinesClose} />
        </div>
        <div className={classnames(styles['save-pipeline-cards'])}>{pipelines}</div>
      </div>
    );
  }
}

export default SavePipeline;
