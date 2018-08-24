import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PipelineBuilderToolbar from 'components/pipeline-builder-toolbar';
import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';

import styles from './pipeline-toolbar.less';

/**
 * The toolbar component.
 */
class PipelineToolbar extends PureComponent {
  static displayName = 'PipelineToolbarComponent';

  static propTypes = {
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
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
    collationCollapseToggled: PropTypes.func.isRequired,
    isCollationExpanded: PropTypes.bool.isRequired
  }

  /**
   * Renders the toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(
        styles['pipeline-toolbar'],
        { [ styles['pipeline-toolbar-border'] ]: !this.props.isCollationExpanded }
      )}>
        <PipelineBuilderToolbar
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          getSavedPipelines={this.props.getSavedPipelines}
          savedPipeline={this.props.savedPipeline}
          clonePipeline={this.props.clonePipeline}
          newPipeline={this.props.newPipeline}
          newPipelineFromText={this.props.newPipelineFromText}
          exportToLanguage={this.props.exportToLanguage}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          isValid={this.props.savedPipeline.isNameValid}
          nameChanged={this.props.nameChanged}
          isModified={this.props.isModified}
          setIsModified={this.props.setIsModified}
          name={this.props.name}
          collationCollapseToggled={this.props.collationCollapseToggled}
          isCollationExpanded={this.props.isCollationExpanded} />
        <PipelinePreviewToolbar
          toggleComments={this.props.toggleComments}
          toggleSample={this.props.toggleSample}
          toggleAutoPreview={this.props.toggleAutoPreview}
          isCommenting={this.props.isCommenting}
          isSampling={this.props.isSampling}
          isAutoPreviewing={this.props.isAutoPreviewing}
          isModified={this.props.isModified} />
      </div>
    );
  }
}

export default PipelineToolbar;
