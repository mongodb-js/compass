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
    runOutStage: PropTypes.func.isRequired,
    gotoOutResults: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    setIsModified: PropTypes.func.isRequired,
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
          setIsModified={this.props.setIsModified}
          fields={this.props.fields}
          stageChanged={this.props.stageChanged} />
        <StagePreview
          documents={this.props.stage.previewDocuments}
          isValid={this.props.stage.isValid}
          isEnabled={this.props.stage.isEnabled}
          isLoading={this.props.stage.isLoading}
          isComplete={this.props.stage.isComplete}
          stageOperator={this.props.stage.stageOperator}
          stageValue={this.props.stage.stage}
          index={this.props.index}
          runOutStage={this.props.runOutStage}
          gotoOutResults={this.props.gotoOutResults} />
      </div>
    );
  }
}

export default StageWorkspace;
