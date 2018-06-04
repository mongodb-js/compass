import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TextButton, IconButton } from 'hadron-react-buttons';
import { Dropdown, MenuItem } from 'react-bootstrap';

import styles from './pipeline-builder-toolbar.less';

/**
 * The pipeline builder toolbar component.
 */
class PipelineBuilderToolbar extends PureComponent {
  static displayName = 'PipelineBuilderToolbarComponent';

  static propTypes = {
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    exportToLanguage: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    nameChanged: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired
  }

  onNameChange = (evt) => {
    this.props.nameChanged(evt.target.value);
    this.props.setIsModified(true);
  }

  handleSavedPipelinesOpen = () => {
    this.props.getSavedPipelines();
    this.props.savedPipelinesListToggle(1);
  }

  handleSavedPipelinesClose = () => {
    this.props.savedPipelinesListToggle(0);
  }

  /**
   * Renders the pipeline builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const clickHandler = this.props.savedPipeline.isListVisible
      ? this.handleSavedPipelinesClose
      : this.handleSavedPipelinesOpen;
    const openPipelinesClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true
    });
    const savePipelineClassName = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': !this.props.isModified || this.props.name.trim() === '',
      'btn-info': this.props.isModified && this.props.name.trim() !== '',
      [ styles['pipeline-builder-toolbar-save-pipeline-button'] ]: true
    });
    const inputClassName = classnames({
      [ styles['pipeline-builder-toolbar-name']]: true
    });

    return (
      <div className={classnames(styles['pipeline-builder-toolbar'])}>
        <IconButton
          title="Toggle Saved Pipelines"
          className={openPipelinesClassName}
          iconClassName="fa fa-folder-open-o"
          clickHandler={clickHandler} />
        <div className={classnames(styles['pipeline-builder-toolbar-add-wrapper'])}>
          <input
            placeholder="Enter a pipeline name..."
            onChange={this.onNameChange}
            className={inputClassName}
            type="text"
            value={this.props.name} />
        </div>
        <TextButton
          text="Save Pipeline"
          disabled={this.props.name.trim() === '' || !this.props.isModified}
          className={savePipelineClassName}
          clickHandler={this.props.saveCurrentPipeline} />
        <Dropdown pullRight id="agg-pipeline-actions">
          <Dropdown.Toggle noCaret>
            <i className="mms-icon-ellipsis" aria-hidden />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <MenuItem onClick={this.props.exportToLanguage}>Export To Language</MenuItem>
            <MenuItem onClick={this.props.clonePipeline}>Clone Pipeline</MenuItem>
            <MenuItem onClick={this.props.newPipeline}>New Pipeline</MenuItem>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}

export default PipelineBuilderToolbar;
