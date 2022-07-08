import React, { Component } from 'react';
import { IconButton } from 'hadron-react-buttons';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import SavePipelineCard from './save-pipeline-card/save-pipeline-card';
import styles from './save-pipeline.module.less';
import { useSavedAggregations, useDeleteSavedItem } from '@mongodb-js/compass-store';

class _SavePipeline extends Component {
  static displayName = 'SavePipelineComponent';

  static propTypes = {
    restorePipelineModalToggle: PropTypes.func.isRequired,
    restorePipelineFrom: PropTypes.func.isRequired,
    deletePipeline: PropTypes.func.isRequired,
    savedPipelinesListToggle: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    items: PropTypes.array.isRequired
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
    const pipelines = this.props.items.map((item) => {
      return (
        <SavePipelineCard
          key={item.id}
          name={item.name}
          objectID={item.aggregation.id}
          restorePipelineModalToggle={this.props.restorePipelineModalToggle}
          restorePipelineFrom={this.props.restorePipelineFrom}
          deletePipeline={() => {
            this.props.deletePipeline(item.id);
          }}
        />
      );
    });

    const className = classnames({
      [ styles['save-pipeline'] ]: true,
      [ styles['save-pipeline-is-visible'] ]: this.props.isVisible
    });

    return (
      <div className={className}>
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

const SavedPipelineList = ({
  namespace,
  restorePipelineModalToggle,
  restorePipelineFrom,
  savedPipelinesListToggle,
  savedPipeline
}) => {
  const items = useSavedAggregations(namespace);
  const deletePipeline = useDeleteSavedItem();

  return (
    <_SavePipeline
      isVisible={savedPipeline.isListVisible}
      savedPipelinesListToggle={savedPipelinesListToggle}
      restorePipelineModalToggle={restorePipelineModalToggle}
      restorePipelineFrom={restorePipelineFrom}
      deletePipeline={deletePipeline}
      items={items}
    ></_SavePipeline>
  );
};

export default SavedPipelineList;
