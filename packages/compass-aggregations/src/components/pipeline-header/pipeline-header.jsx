import React, { PureComponent } from 'react';
import { ViewSwitcher } from 'hadron-react-components';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import AddStageButton from 'components/add-stage-button';
import { CODE, BUILDER } from 'modules/view';

import styles from './pipeline-header.less';

/**
 * Displays the pipeline header.
 */
class PipelineHeader extends PureComponent {
  static displayName = 'PipelineHeaderComponent';

  static propTypes = {
    view: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    viewChanged: PropTypes.func.isRequired
  }

  /**
   * Handle the view switch.
   *
   * @param {String} view - The new view.
   */
  onViewChanged = (view) => {
    this.props.viewChanged(view);
  }

  /**
   * Render the pipeline header component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-header'])}>
        <ViewSwitcher
          label="VIEW"
          buttonLabels={[ CODE, BUILDER ]}
          activeButton={this.props.view}
          onClick={this.onViewChanged} />
        <AddStageButton className="add-stage-button" stageAdded={this.props.stageAdded} />
      </div>
    );
  }
}

export default PipelineHeader;
