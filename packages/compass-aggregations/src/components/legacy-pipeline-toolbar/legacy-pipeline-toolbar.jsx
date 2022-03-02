import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PipelineBuilderToolbar from './pipeline-builder-toolbar';
import PipelinePreviewToolbar from './pipeline-preview-toolbar';

import styles from './pipeline-toolbar.module.less';

/**
 * The toolbar component.
 */
class LegacyPipelineToolbar extends PureComponent {
  static displayName = 'LegacyPipelineToolbarComponent';

  static propTypes = {
    isAtlasDeployed: PropTypes.bool.isRequired,
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    setIsNewPipelineConfirm: PropTypes.func.isRequired,
    newPipelineFromText: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    exportToLanguage: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    nameChanged: PropTypes.func.isRequired,
    toggleComments: PropTypes.func.isRequired,
    toggleSample: PropTypes.func.isRequired,
    toggleAutoPreview: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isSampling: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    setIsModified: PropTypes.func.isRequired,
    name: PropTypes.string,
    editViewName: PropTypes.string,
    updateView: PropTypes.func.isRequired,
    collationCollapseToggled: PropTypes.func.isRequired,
    isCollationExpanded: PropTypes.bool.isRequired,
    isOverviewOn: PropTypes.bool.isRequired,
    toggleOverview: PropTypes.func.isRequired,
    toggleSettingsIsExpanded: PropTypes.func.isRequired,
    isFullscreenOn: PropTypes.bool.isRequired,
    toggleFullscreen: PropTypes.func.isRequired,
    savingPipelineOpen: PropTypes.func.isRequired,
    serverVersion: PropTypes.string.isRequired,
    openCreateView: PropTypes.func.isRequired,
  };

  static defaultProps = {
    savedPipeline: {
      isNameValid: true,
    },
  };

  /**
   * Renders the toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div
        className={classnames(styles['pipeline-toolbar'], {
          [styles['pipeline-toolbar-border']]: !this.props.isCollationExpanded,
        })}
      >
        <PipelineBuilderToolbar
          isAtlasDeployed={this.props.isAtlasDeployed}
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          updateView={this.props.updateView}
          getSavedPipelines={this.props.getSavedPipelines}
          savedPipeline={this.props.savedPipeline}
          clonePipeline={this.props.clonePipeline}
          newPipelineFromText={this.props.newPipelineFromText}
          exportToLanguage={this.props.exportToLanguage}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          isValid={this.props.savedPipeline.isNameValid}
          nameChanged={this.props.nameChanged}
          isModified={this.props.isModified}
          setIsModified={this.props.setIsModified}
          name={this.props.name}
          editViewName={this.props.editViewName}
          collationCollapseToggled={this.props.collationCollapseToggled}
          isCollationExpanded={this.props.isCollationExpanded}
          isOverviewOn={this.props.isOverviewOn}
          toggleOverview={this.props.toggleOverview}
          savingPipelineOpen={this.props.savingPipelineOpen}
          serverVersion={this.props.serverVersion}
          openCreateView={this.props.openCreateView}
          setIsNewPipelineConfirm={this.props.setIsNewPipelineConfirm}
        />
        <PipelinePreviewToolbar
          isAtlasDeployed={this.props.isAtlasDeployed}
          toggleComments={this.props.toggleComments}
          toggleSample={this.props.toggleSample}
          toggleAutoPreview={this.props.toggleAutoPreview}
          isCommenting={this.props.isCommenting}
          isSampling={this.props.isSampling}
          isAutoPreviewing={this.props.isAutoPreviewing}
          isModified={this.props.isModified}
          toggleSettingsIsExpanded={this.props.toggleSettingsIsExpanded}
          isFullscreenOn={this.props.isFullscreenOn}
          toggleFullscreen={this.props.toggleFullscreen}
        />
      </div>
    );
  }
}

export default LegacyPipelineToolbar;
