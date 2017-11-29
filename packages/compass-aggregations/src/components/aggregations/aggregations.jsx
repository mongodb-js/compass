import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import StageEditor from 'components/stage-editor';
import { STAGE_CHANGED } from 'constants/actions';

import styles from './aggregations.less';

/**
 * The core aggregations component.
 */
class Aggregations extends Component {
  static displayName = 'AggregationsComponent';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    onStageChange: PropTypes.func.isRequired
  }

  /**
   * Render the stage editors.
   *
   * @returns {Array} The components.
   */
  renderStageEditors() {
    return this.props.stages.map((stage, i) => {
      return (
        <StageEditor
          stage={stage}
          index={i}
          serverVersion={this.props.serverVersion}
          key={i}
          onStageChange={this.props.onStageChange} />
      );
    });
  }

  /**
   * Render Aggregations component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.aggregations)}>
        {this.renderStageEditors()}
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
 * Map actions to dispatch to properties in the component.
 *
 * @param {Function} dispatch - The store dispatch function.
 *
 * @returns {Object} The properties.
 */
const mapDispatchToProps = (dispatch) => {
  return {
    onStageChange: (stage, index) => {
      dispatch({ type: STAGE_CHANGED, stage: stage, index: index });
    }
  };
};

/**
 * Connect the redux store to the component.
 */
const MappedAggregations = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Aggregations);

export default MappedAggregations;
export { MappedAggregations };
