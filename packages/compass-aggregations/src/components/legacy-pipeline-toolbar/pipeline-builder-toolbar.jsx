import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { IconButton, TextButton } from 'hadron-react-buttons';
import { Tooltip } from 'hadron-react-components';
import { Dropdown, MenuItem, Button } from 'react-bootstrap';
import OverviewToggler from './overview-toggler';
import CollationCollapser from './collation-collapser';
import semver from 'semver';

import {
  TOOLTIP_EXPORT_TO_LANGUAGE,
  TOOLTIP_OPEN_SAVED_PIPELINES,
  VIEWS_MIN_SERVER_VERSION
} from '../../constants';

import styles from './pipeline-builder-toolbar.module.less';

/**
 * The pipeline builder toolbar component.
 */
class PipelineBuilderToolbar extends PureComponent {
  static displayName = 'PipelineBuilderToolbarComponent';

  static propTypes = {
    isAtlasDeployed: PropTypes.bool.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    exportToLanguage: PropTypes.func.isRequired,
    setIsNewPipelineConfirm: PropTypes.func.isRequired,
    newPipelineFromText: PropTypes.func.isRequired,

    nameChanged: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    editViewName: PropTypes.string,

    setIsModified: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired,

    collationCollapseToggled: PropTypes.func.isRequired,
    isCollationExpanded: PropTypes.bool.isRequired,

    isOverviewOn: PropTypes.bool.isRequired,
    toggleOverview: PropTypes.func.isRequired,
    updateView: PropTypes.func.isRequired,

    serverVersion: PropTypes.string.isRequired,
    openCreateView: PropTypes.func.isRequired,

    /**
     * Saved Pipelines
     *
     * TODO (@imlucas) To make this clearer for future travellers:
     * - Rename `savedPipeline` to `savedPipelineList`
     * - Rename `savingPipeline*` to `savePipeline`
     */
    savedPipeline: PropTypes.object.isRequired,
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    savingPipelineOpen: PropTypes.func.isRequired
  };

  /**
   * Name change event handler.
   *
   * @param {Object} evt
   */
  onNameChange = (evt) => {
    this.props.nameChanged(evt.target.value);
    this.props.setIsModified(true);
  };

  /**
   * Handle clicks on the `Save` button.
   *
   * @returns {void}
   */
  onSaveClicked = () => {
    if (!this.isSavedPipeline()) {
      this.props.savingPipelineOpen();
      return;
    }
    this.props.saveCurrentPipeline();
    this.props.setIsModified(false);
  };

  /**
   * Handle clicks on the `Save As...` MenuItem.
   *
   * @returns {void}
   */
  onSaveAsClicked = () => {
    if (!this.isSavedPipeline()) {
      this.onSaveClicked();
      return;
    }
    this.props.savingPipelineOpen({ name: this.props.name, isSaveAs: true });
  };

  /**
   * Handle clicks on the `Toggle Saved Pipelines` button to open pipelines.
   */
  handleSavedPipelinesOpen = () => {
    this.props.getSavedPipelines();
    this.props.savedPipelinesListToggle(1);
  };

  /**
   * Handle clicks on the `Toggle Saved Pipelines` button to close pipelines.
   */
  handleSavedPipelinesClose = () => {
    this.props.savedPipelinesListToggle(0);
  };

  /**
   * Is the current pipeline already saved?
   *
   * @returns {Boolean}
   */
  isSavedPipeline() {
    return this.props.name !== '';
  }

  /**
   * Handle clicks on the new pipeline button and show
   * confirmation modal first.
   */
  showNewPipelineConfirmModal() {
    this.props.setIsNewPipelineConfirm(true);
  }

  /**
   * Renders the is modified indicator.
   *
   * @returns {React.Component} The component.
   */
  renderIsModifiedIndicator() {
    const isModifiedClassName = classnames({
      [styles['is-modified']]: true,
      [styles['is-modified-on']]: this.props.isModified
    });
    if (!this.props.isModified) {
      return null;
    }
    return (
      <div className={isModifiedClassName}>
        - <span>Modified</span>
      </div>
    );
  }

  /**
   * Renders the save dropdown menu.
   *
   * @returns {React.Component} The component.
   */
  renderSaveDropdownMenu() {
    const children = [
      <MenuItem
        key="save-pipeline-as"
        data-testid="save-pipeline-as"
        onClick={this.onSaveAsClicked.bind(this)}
      >
        Save pipeline as&hellip;
      </MenuItem>
    ];

    const serverViewsAvailable = semver.gte(
      this.props.serverVersion,
      VIEWS_MIN_SERVER_VERSION
    );

    if (serverViewsAvailable) {
      children.push(
        <MenuItem
          key="create-a-view"
          data-testid="create-a-view"
          onClick={this.props.openCreateView}
        >
          Create a view
        </MenuItem>
      );
    }
    return children;
  }

  /**
   * Renders the saved pipeline list toggler.
   *
   * @returns {React.Component} The component.
   */
  renderSavedPipelineListToggler() {
    if (!this.props.isAtlasDeployed && !this.props.editViewName) {
      const clickHandler = this.props.savedPipeline.isListVisible
        ? this.handleSavedPipelinesClose
        : this.handleSavedPipelinesOpen;

      return (
        <span
          data-tip={TOOLTIP_OPEN_SAVED_PIPELINES}
          data-for="open-saved-pipelines"
          data-place="top"
          data-html="true">
          <IconButton
            title="Toggle Saved Pipelines"
            className={classnames(
              'btn',
              'btn-xs',
              'btn-default',
              styles['pipeline-builder-toolbar-open-saved-pipelines-button']
            )}
            iconClassName="fa fa-folder-open-o"
            clickHandler={clickHandler}
          />
          <Tooltip id="open-saved-pipelines" />
        </span>
      );
    }
  }

  /**
   * Renders the new pipeline actions item.
   *
   * @returns {React.Component} The component.
   */
  renderNewPipelineActionsItem() {
    if (!this.props.editViewName) {
      return (
        <div>
          <Dropdown id="new-pipeline-actions" className="btn-group">
            <Button
              id="create-new-pipeline"
              variant="default"
              className={classnames(
                'btn-xs',
                styles['pipeline-builder-toolbar-new-button']
              )}
              onClick={this.showNewPipelineConfirmModal.bind(this)}>
              <i className="fa fa-plus-circle" />
            </Button>
            <Dropdown.Toggle className="btn-default btn-xs btn" />

            <Dropdown.Menu>
              <MenuItem onClick={this.props.newPipelineFromText}>
                New Pipeline From Text
              </MenuItem>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      );
    }
  }

  /**
   * Renders the saved pipeline name item.
   *
   * @returns {React.Component} The component.
   */
  renderSavedPipelineNameItem() {
    if (!this.props.isAtlasDeployed && !this.props.editViewName) {
      return (
        <div className={styles['pipeline-builder-toolbar-add-wrapper']}>
          <div className={styles['pipeline-builder-toolbar-name']}>
            {this.props.name || 'Untitled'}
          </div>
          {this.renderIsModifiedIndicator()}
        </div>
      );
    }
  }

  /**
   * Renders the save pipeline actions item.
   *
   * @returns {React.Component} The component.
   */
  renderSavePipelineActionsItem() {
    if (!this.props.isAtlasDeployed && !this.props.editViewName) {
      const savePipelineClassName = classnames({
        btn: true,
        'btn-xs': true,
        'btn-primary': true,
        [styles['pipeline-builder-toolbar-save-pipeline-button']]: true
      });

      return (
        <div>
          <Dropdown id="save-pipeline-actions">
            <Button
              className={savePipelineClassName}
              variant="primary"
              onClick={this.onSaveClicked.bind(this)}>
              Save
            </Button>

            <Dropdown.Toggle className="btn-xs btn btn-primary" />
            <Dropdown.Menu>{this.renderSaveDropdownMenu()}</Dropdown.Menu>
          </Dropdown>
        </div>
      );
    }
  }

  /**
   * Renders the export to language item.
   *
   * @returns {React.Component} The component.
   */
  renderExportToLanguageItem() {
    return (
      <div
        className={styles['pipeline-builder-toolbar-export-to-language']}
        data-tip={TOOLTIP_EXPORT_TO_LANGUAGE}
        data-for="export-to-language"
        data-place="top"
        data-html="true">
        <IconButton
          dataTestId="export-to-language"
          className="btn btn-xs btn-default"
          iconClassName={classnames(styles['export-icon'])}
          clickHandler={this.props.exportToLanguage}
          title="Export To Language" />
        <Tooltip id="export-to-language" />
      </div>
    );
  }

  /**
   * Renders the update view button.
   *
   * @returns {React.Component} The component.
   */
  renderUpdateViewButton() {
    if (this.props.editViewName) {
      return (
        <div className={classnames(styles['pipeline-builder-toolbar-update-view'])}>
          <TextButton
            className="btn btn-xs btn-primary"
            text="Update View"
            title="Update View"
            disabled={!this.props.isModified}
            clickHandler={this.props.updateView} />
        </div>
      );
    }
  }

  /**
   * Renders the pipeline builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles['pipeline-builder-toolbar']}>
        <OverviewToggler
          isOverviewOn={this.props.isOverviewOn}
          toggleOverview={this.props.toggleOverview}
        />
        {this.renderSavedPipelineListToggler()}
        {this.renderNewPipelineActionsItem()}
        <CollationCollapser
          isCollationExpanded={this.props.isCollationExpanded}
          collationCollapseToggled={this.props.collationCollapseToggled}
        />
        {this.renderUpdateViewButton()}
        {this.renderSavedPipelineNameItem()}
        {this.renderSavePipelineActionsItem()}
        {this.renderExportToLanguageItem()}
      </div>
    );
  }
}

export default PipelineBuilderToolbar;
