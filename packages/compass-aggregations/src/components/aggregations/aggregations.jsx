import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Pipeline from 'components/pipeline';
import Results from 'components/results';
import { namespaceChanged } from 'modules/namespace';
import { viewChanged } from 'modules/view';
import { copyToClipboard } from 'modules/clipboard';
import { executePipeline } from 'modules/results';
import { sampleChanged, sampleToggled } from 'modules/sample';
import {
  stageAdded,
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stageToggled
} from 'modules/stages';

import styles from './aggregations.less';

/**
 * The core aggregations component.
 */
class Aggregations extends Component {
  static displayName = 'AggregationsComponent';

  static propTypes = {
    namespaceChanged: PropTypes.func.isRequired,
    executePipeline: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    sample: PropTypes.object.isRequired,
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    sampleChanged: PropTypes.func.isRequired,
    sampleToggled: PropTypes.func.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    viewChanged: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired
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
        <Results {...this.props} />
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
  fields: state.fields,
  namespace: state.namespace,
  results: state.results,
  sample: state.sample,
  serverVersion: state.serverVersion,
  stages: state.stages,
  view: state.view
});

/**
 * Connect the redux store to the component.
 */
const MappedAggregations = connect(
  mapStateToProps,
  {
    executePipeline,
    namespaceChanged,
    sampleChanged,
    sampleToggled,
    stageAdded,
    stageChanged,
    stageCollapseToggled,
    stageDeleted,
    stageMoved,
    stageOperatorSelected,
    stageToggled,
    viewChanged,
    copyToClipboard
  },
)(Aggregations);

export default MappedAggregations;
export { Aggregations };
