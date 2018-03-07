import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import StageEditor from 'components/stage-editor';
import StagePreview from 'components/stage-preview';

import styles from './stage-workspace.less';

/**
 * The stage workspace component.
 */
class StageWorkspace extends PureComponent {
  static displayName = 'StageWorkspace';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    runStage: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    stageChanged: PropTypes.func.isRequired
  }

  /**
   * Renders the stage workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-workspace'])}>
        <StageEditor
          stage={this.props.stage}
          runStage={this.props.runStage}
          index={this.props.index}
          serverVersion={this.props.serverVersion}
          fields={this.props.fields}
          stageChanged={this.props.stageChanged} />
        <StagePreview stage={this.props.stage} />
      </div>
    );
  }
}

export default StageWorkspace;
