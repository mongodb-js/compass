import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Pipeline from 'components/pipeline';
import { stageAdded, stageChanged, stageDeleted } from 'modules/stages';

import styles from './aggregations.less';

/**
 * The core aggregations component.
 */
class Aggregations extends Component {
  static displayName = 'AggregationsComponent';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired
  }

  /**
   * Render Aggregations component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.aggregations)}>
        <Pipeline {...this.props} />
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
const mapStateToProps = (state) => ({
  serverVersion: state.serverVersion,
  stages: state.stages
});

/**
 * Connect the redux store to the component.
 */
const MappedAggregations = connect(
  mapStateToProps,
  { stageAdded, stageChanged, stageDeleted },
)(Aggregations);

export default MappedAggregations;
export { Aggregations };
