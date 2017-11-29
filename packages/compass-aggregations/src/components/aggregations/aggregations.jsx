import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import StageEditor from 'components/stage-editor';
import { stageChanged } from 'action-creators';

import styles from './aggregations.less';

/**
 * The core aggregations component.
 */
class Aggregations extends Component {
  static displayName = 'AggregationsComponent';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageChanged: PropTypes.func.isRequired
  }

  /**
   * Render Aggregations component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const stageEditors = this.props.stages.map((stage, i) => {
      return (
        <StageEditor
          stage={stage}
          index={i}
          serverVersion={this.props.serverVersion}
          key={i}
          stageChanged={this.props.stageChanged} />
      );
    });
    return (
      <div className={classnames(styles.aggregations)}>
        {stageEditors}
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => {
  return {
    stages: state.stages,
    serverVersion: state.serverVersion
  };
};

/**
 * Connect the redux store to the component.
 */
const MappedAggregations = connect(
  mapStateToProps,
  { stageChanged },
)(Aggregations);

export default MappedAggregations;
export { MappedAggregations };
