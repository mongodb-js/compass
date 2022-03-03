import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { Tooltip } from 'hadron-react-components';
import { IconButton } from 'hadron-react-buttons';
import { Toggle } from '@mongodb-js/compass-components';

import styles from './pipeline-preview-toolbar.module.less';
import { TOOLTIP_PREVIEW_MODE, TOOLTIP_SAMPLING_MODE } from '../../constants';

/**
 * The pipeline preview toolbar component.
 */
class PipelinePreviewToolbar extends PureComponent {
  static displayName = 'PipelinePreviewToolbarComponent';

  static propTypes = {
    isAtlasDeployed: PropTypes.bool.isRequired,
    toggleSample: PropTypes.func.isRequired,
    toggleAutoPreview: PropTypes.func.isRequired,
    isSampling: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    toggleSettingsIsExpanded: PropTypes.func.isRequired,
    isFullscreenOn: PropTypes.bool.isRequired,
    toggleFullscreen: PropTypes.func.isRequired
  };

  renderAutoPreviewToggle() {
    return (
      <div
        className={styles['toggle-auto-preview']}
        data-for="preview-mode"
        data-tip={TOOLTIP_PREVIEW_MODE}
        data-place="top"
        data-html="true"
      >
        <Toggle
          checked={this.props.isAutoPreviewing}
          onChange={this.props.toggleAutoPreview}
          className={styles.toggle}
          id="autoPreviewToggle"
          size="xsmall"
          aria-labelledby="autoPreviewToggleLabel"
        />
        <label
          className={styles['toggle-auto-preview-label']}
          htmlFor="autoPreviewToggle"
          id="autoPreviewToggleLabel"
        >
          Auto Preview
        </label>
        <Tooltip id="preview-mode" />
      </div>
    );
  }

  renderSampleToggle() {
    if (!this.props.isAtlasDeployed) {
      return (
        <div
          className={styles['toggle-sample']}
          data-tip={TOOLTIP_SAMPLING_MODE}
          data-for="sampling-mode"
          data-place="top"
          data-html="true"
        >
          <Toggle
            id="sampleModeToggle"
            checked={this.props.isSampling}
            onChange={this.props.toggleSample}
            className={styles.toggle}
            size="xsmall"
            aria-labelledby="sampleModeToggleLabel"
          />
          <label
            className={styles['toggle-sample-label']}
            htmlFor="sampleModeToggle"
            id="sampleModeToggleLabel"
          >Sample Mode</label>
          <Tooltip id="sampling-mode" />
        </div>
      );
    }
  }

  renderFullscreenButton() {
    const { isFullscreenOn } = this.props;

    const iconClassName = isFullscreenOn ? 'fa fa-compress' : 'fa fa-expand';
    const title = isFullscreenOn ? 'Exit Fullscreen' : 'Enter Fullscreen';
    /**
     * NOTE: Not using `<IconButton />` here because it assumes no need to re-render,
     * but in this case, we do.
     */
    return (
      <div className={styles.fullscreen}>
        <button
          type="button"
          title={title}
          className="btn btn-xs btn-default"
          onClick={this.props.toggleFullscreen}>
          <i className={iconClassName} aria-hidden />
        </button>
      </div>
    );
  }

  renderSettingsToggle() {
    return (
      <div className={styles.settings}>
        <IconButton
          title="Settings"
          dataTestId="aggregation-settings"
          className="btn btn-xs btn-default"
          iconClassName="fa fa-gear"
          clickHandler={this.props.toggleSettingsIsExpanded}
        />
      </div>
    );
  }

  /**
   * Renders the pipeline preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles['container-right']}>
        {this.renderSampleToggle()}
        {this.renderAutoPreviewToggle()}
        {this.renderSettingsToggle()}
      </div>
    );
  }
}

export default PipelinePreviewToolbar;
