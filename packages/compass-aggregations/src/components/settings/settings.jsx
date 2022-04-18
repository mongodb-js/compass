import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Label, Description } from '@mongodb-js/compass-components';

import { TextButton } from 'hadron-react-buttons';
import {
  DEFAULT_MAX_TIME_MS,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_LARGE_LIMIT
} from '../../constants';

import styles from './settings.module.less';

class Settings extends PureComponent {
  static displayName = 'Settings';
  static propTypes = {
    isAtlasDeployed: PropTypes.bool.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    limit: PropTypes.number.isRequired,
    largeLimit: PropTypes.number.isRequired,
    maxTimeMS: PropTypes.number.isRequired,
    settings: PropTypes.object.isRequired,
    toggleSettingsIsExpanded: PropTypes.func.isRequired,
    toggleSettingsIsCommentMode: PropTypes.func.isRequired,
    setSettingsSampleSize: PropTypes.func.isRequired,
    setSettingsMaxTimeMS: PropTypes.func.isRequired,
    setSettingsLimit: PropTypes.func.isRequired,
    applySettings: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired
  };

  onCancelClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.toggleSettingsIsExpanded();
  }

  onCommentModeClicked() {
    this.props.toggleSettingsIsCommentMode();
  }

  onSampleSizeChanged(evt) {
    this.props.setSettingsSampleSize(parseInt(evt.currentTarget.value, 10));
  }

  onMaxTimeoutChanged(evt) {
    this.props.setSettingsMaxTimeMS(parseInt(evt.currentTarget.value, 10));
  }

  onLimitChanged(evt) {
    this.props.setSettingsLimit(parseInt(evt.currentTarget.value, 10));
  }

  onApplyClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    // Update the settings in the state.
    this.props.applySettings();

    // Updated settings used to run all stages in the current pipeline.
    this.props.runStage(0);

    // Hide the settings panel.
    this.props.toggleSettingsIsExpanded();
  }

  renderLargeLimit() {
    if (!this.props.isAtlasDeployed) {
      let limit = this.props.largeLimit;
      if (this.props.settings.isDirty) {
        limit = this.props.settings.limit;
      }

      return (
        <div className={classnames(styles['input-group'])}>
          <div className={classnames(styles['input-meta'])}>
            <Label htmlFor='aggregation-limit'>Limit</Label>
            <Description id="aggregation-limit-description">
              Limits input documents before $group, $bucket, and $bucketAuto
              stages. Set a limit to make the collection run faster.
            </Description>
          </div>
          <div className={classnames(styles['input-control'])}>
            <input
              id="aggregation-limit"
              aria-describedby="aggregation-limit-description"
              type="number"
              min="0"
              placeholder={DEFAULT_LARGE_LIMIT}
              value={limit}
              onChange={this.onLimitChanged.bind(this)} />
          </div>
        </div>
      );
    }
  }

  renderMaxTimeMs() {
    const isNewToolbar =
      global?.process?.env?.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR === 'true';
    if (isNewToolbar) {
      return null;
    }

    const maxTimeMS = this.props.settings.isDirty
      ? this.props.settings.maxTimeMS
      : this.props.maxTimeMS;

    return (
      <div className={classnames(styles['input-group'])}>
        <div className={classnames(styles['input-meta'])}>
          <Label htmlFor="aggregation-max-time-ms">Max Time</Label>
          <Description id="aggregation-max-time-ms-description">
            Specifies a cumulative time limit in milliseconds for processing
            operations on a cursor. Max timeout prevents long hang times.
          </Description>
        </div>
        <div className={classnames(styles['input-control'])}>
          <input
            id="aggregation-max-time-ms"
            aria-describedby="aggregation-max-time-ms-description"
            type="number"
            placeholder={DEFAULT_MAX_TIME_MS}
            min="0"
            step="1000"
            value={maxTimeMS}
            onChange={this.onMaxTimeoutChanged.bind(this)}
          />
        </div>
      </div>
    );
  }

  renderFields() {
    let commentModeChecked = this.props.isCommenting;
    let sampleSize = this.props.limit;

    if (this.props.settings.isDirty) {
      commentModeChecked = this.props.settings.isCommentMode;
      sampleSize = this.props.settings.sampleSize;
    }

    return (
      <div className={classnames(styles.body)}>
        <div className={classnames(styles['input-group'])}>
          <div className={classnames(styles['input-meta'])}>
            <Label htmlFor="aggregation-comment-mode">Comment Mode</Label>
            <Description id="aggregation-comment-mode-description">
              When enabled, adds helper comments to each stage. Only applies to
              new stages.
            </Description>
          </div>
          <div className={classnames(styles['input-control'])}>
            <input
              id="aggregation-comment-mode"
              aria-describedby="aggregation-comment-mode-description"
              type="checkbox"
              checked={commentModeChecked}
              onChange={this.onCommentModeClicked.bind(this)}
            />
          </div>
        </div>
        <div className={classnames(styles['input-group'])}>
          <div className={classnames(styles['input-meta'])}>
            <Label htmlFor="aggregation-sample-size">Number of Preview Documents</Label>
            <Description id="aggregation-sample-size-description">Specify the number of documents to show in the preview.</Description>
          </div>
          <div className={classnames(styles['input-control'])}>
            <input
              id="aggregation-sample-size"
              aria-describedby="aggregation-sample-size-description"
              type="number"
              min="0"
              placeholder={DEFAULT_SAMPLE_SIZE}
              value={sampleSize}
              onChange={this.onSampleSizeChanged.bind(this)}
            />
          </div>
        </div>
        {this.renderMaxTimeMs()}
        {this.renderLargeLimit()}
      </div>
    );
  }
  render() {
    if (!this.props.isExpanded) {
      return null;
    }

    return (
      <div className={classnames(styles.container)}>
        <div className={classnames(styles.header)}>
          <div className={classnames(styles['header-title'])}>Settings</div>
          <div className={classnames(styles['header-btn-group'])}>
            <TextButton
              id="aggregations-settings-cancel"
              className="btn btn-default btn-xs"
              text="Cancel"
              clickHandler={this.onCancelClicked.bind(this)}
            />

            <TextButton
              id="aggregation-settings-apply"
              className="btn btn-primary btn-xs"
              text="Apply"
              clickHandler={this.onApplyClicked.bind(this)}
            />
          </div>
        </div>
        {this.renderFields()}
      </div>
    );
  }
}

export default Settings;
