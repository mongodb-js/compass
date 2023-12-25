import React, { Component } from 'react';
import { connect } from 'react-redux';
import Pipeline from '../pipeline';
import { clonePipeline } from '../../modules/clone-pipeline';
import { saveCurrentPipeline } from '../../modules/saved-pipeline';
import {
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  applySettings,
} from '../../modules/settings';
import {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
} from '../../modules/saving-pipeline';
import { dismissViewError } from '../../modules/update-view';

import type { RootState } from '../../modules';
import type { PipelineProps } from '../pipeline/pipeline';
import { css, palette } from '@mongodb-js/compass-components';

const aggregationsStyles = css({
  display: 'flex',
  alignItems: 'flex-start',
  backgroundColor: palette.gray.light3,
  position: 'relative',
  width: '100%',
  zIndex: 0,
  height: '100%',
});

/**
 * The core aggregations component.
 */
class Aggregations extends Component<PipelineProps> {
  static displayName = 'AggregationsComponent';

  /**
   * Render Aggregations component.
   */
  render() {
    return (
      <div className={aggregationsStyles} data-testid="compass-aggregations">
        <Pipeline {...this.props} />
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {import('../../modules').RootState} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state: RootState) => ({
  namespace: state.namespace,
  name: state.name,
  collationString: state.collationString,
  isCommenting: state.comments,
  isAutoPreviewing: state.autoPreview,
  settings: state.settings,
  limit: state.limit,
  largeLimit: state.largeLimit,
  maxTimeMS: state.maxTimeMS.current,
  savingPipeline: state.savingPipeline,
  updateViewError: state.updateViewError,
  workspace: state.workspace,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedAggregations = connect(mapStateToProps, {
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  saveCurrentPipeline,
  clonePipeline,
  applySettings,
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  dismissViewError,
})(Aggregations);

export default MappedAggregations;
export { Aggregations };
