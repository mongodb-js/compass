import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TextButton, IconButton } from 'hadron-react-buttons';
import { Dropdown, MenuItem } from 'react-bootstrap';
import OverviewToggler from './overview-toggler';
import CollationCollapser from './collation-collapser';

import styles from './pipeline-builder-toolbar.less';

/**
 * The pipeline builder toolbar component.
 */
class PipelineBuilderToolbar extends PureComponent {
  static displayName = 'PipelineBuilderToolbarComponent';

  static propTypes = {
    clonePipeline: PropTypes.func.isRequired,
    exportToLanguage: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    newPipelineFromText: PropTypes.func.isRequired,

    /**
     * TODO (@imlucas) Replace all these { var, toggler() } props when we get hooks.
     */
    nameChanged: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,

    setIsModified: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired,

    collationCollapseToggled: PropTypes.func.isRequired,
    isCollationExpanded: PropTypes.bool.isRequired,

    isOverviewOn: PropTypes.bool.isRequired,
    toggleOverview: PropTypes.func.isRequired,

    /**
     * Saved Pipelines
     */
    savedPipeline: PropTypes.object.isRequired, // TODO List of saved-pipelines.
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired
  };

  /**
   * Name change event handler.
   *
   * @param {Object} evt
   */
  onNameChange = evt => {
    this.props.nameChanged(evt.target.value);
    this.props.setIsModified(true);
  };

  handleSavedPipelinesOpen = () => {
    this.props.getSavedPipelines();
    this.props.savedPipelinesListToggle(1);
  };

  handleSavedPipelinesClose = () => {
    this.props.savedPipelinesListToggle(0);
  };

  /**
   * Renders the pipeline builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const clickHandler = this.props.savedPipeline.isListVisible
      ? this.handleSavedPipelinesClose
      : this.handleSavedPipelinesOpen;

    const savePipelineClassName = classnames({
      btn: true,
      'btn-xs': true,
      'btn-default': !this.props.isModified || this.props.name.trim() === '',
      'btn-info': this.props.isModified && this.props.name.trim() !== '',
      [styles['pipeline-builder-toolbar-save-pipeline-button']]: true
    });
    const inputClassName = classnames({
      [styles['pipeline-builder-toolbar-name']]: true
    });

    return (
      <div className={classnames(styles['pipeline-builder-toolbar'])}>
        <OverviewToggler
          isOverviewOn={this.props.isOverviewOn}
          toggleOverview={this.props.toggleOverview}
        />
        <IconButton
          title="Toggle Saved Pipelines"
          className={classnames('btn', 'btn-xs', 'btn-default', styles['pipeline-builder-toolbar-open-saved-pipelines-button'])}
          iconClassName="fa fa-folder-open-o"
          clickHandler={clickHandler}
        />
        <CollationCollapser
          isCollationExpanded={this.props.isCollationExpanded}
          collationCollapseToggled={this.props.collationCollapseToggled}
        />
        <div
          className={classnames(
            styles['pipeline-builder-toolbar-add-wrapper']
          )}>
          <input
            placeholder="Enter a pipeline name..."
            onChange={this.onNameChange}
            className={inputClassName}
            type="text"
            value={this.props.name}
          />
        </div>
        <TextButton
          text="Save Pipeline"
          disabled={this.props.name.trim() === '' || !this.props.isModified}
          className={savePipelineClassName}
          clickHandler={this.props.saveCurrentPipeline}
        />
        <Dropdown pullRight id="agg-pipeline-actions">
          <Dropdown.Toggle noCaret>
            <i className="mms-icon-ellipsis" aria-hidden />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <MenuItem onClick={this.props.exportToLanguage}>
              Export To Language
            </MenuItem>
            <MenuItem onClick={this.props.clonePipeline}>
              Clone Pipeline
            </MenuItem>
            <MenuItem onClick={this.props.newPipeline}>New Pipeline</MenuItem>
            <MenuItem onClick={this.props.newPipelineFromText}>
              New Pipeline From Text
            </MenuItem>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}

export default PipelineBuilderToolbar;
