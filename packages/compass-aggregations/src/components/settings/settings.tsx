import React, { useCallback, useMemo } from 'react';
import { Checkbox, Label, Description, Button, TextInput } from '@mongodb-js/compass-components';

import { DEFAULT_SAMPLE_SIZE, DEFAULT_LARGE_LIMIT } from '../../constants';

import styles from './settings.module.less';


type SettingsProp = {
  isAtlasDeployed: boolean;
  isCommenting: boolean;
  isExpanded: boolean;
  largeLimit: number;
  limit: number;
  settings: {
    limit: number;
    largeLimit: number;
    isCommentMode: boolean;
    isDirty: number;
    sampleSize: number;
  };
  toggleSettingsIsExpanded: () => void;
  toggleSettingsIsCommentMode: () => void;
  setSettingsSampleSize: (sampleSize: number) => void;
  setSettingsLimit: (limit: number) => void;
  applySettings: () => void;
};

const aggregationCommentModeId = 'aggregation-comment-mode';
const aggregationCommentModeDescriptionId = 'aggregation-comment-mode-description';
const aggregationCommentModeLabelId = 'aggregation-comment-mode-label';

const aggregationSampleSizeId = 'aggregation-sample-size';
const aggregationSampleSizeDescriptionId = 'aggregation-sample-size-description';
const aggregationSampleSizeLabelId = 'aggregation-sample-size-label';

const aggregationLimitId = 'aggregation-limit';
const aggregationLimitDescriptionId = 'aggregation-limit-description';
const aggregationLimitLabelId = 'aggregation-limit-label';

function Settings({
  isAtlasDeployed,
  isCommenting,
  isExpanded,
  largeLimit,
  limit,
  settings,
  applySettings,
  setSettingsLimit,
  setSettingsSampleSize,
  toggleSettingsIsCommentMode,
  toggleSettingsIsExpanded,
}: SettingsProp) {
  const onSampleSizeChanged = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setSettingsSampleSize(parseInt(evt.currentTarget.value, 10));
  }, [ setSettingsSampleSize ]);

  const onLimitChanged = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setSettingsLimit(parseInt(evt.currentTarget.value, 10));
  }, [ setSettingsLimit ]);

  const onApplyClicked = useCallback(() => {
    // Update the settings in the state.
    applySettings();

    // Hide the settings panel.
    toggleSettingsIsExpanded();
  }, [ applySettings, toggleSettingsIsExpanded ]);

  const aggregationLimit = useMemo(
    () => settings.isDirty ? settings.limit : largeLimit, [ settings, largeLimit ]
  );
  const commentModeChecked = useMemo(
    () => settings.isDirty ? settings.isCommentMode : isCommenting, [ settings, isCommenting ]
  );
  const sampleSize = useMemo(
    () => settings.isDirty ? settings.sampleSize : limit, [ settings, limit ]
  );

  // TODO: move this up a level?
  if (!isExpanded) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles['header-title']}>Settings</div>
        <div className={styles['header-btn-group']}>
          <Button
            id="aggregations-settings-cancel"
            size="xsmall"
            onClick={toggleSettingsIsExpanded}
          >Cancel</Button>
          <Button
            id="aggregation-settings-apply"
            size="xsmall"
            variant="primary"
            onClick={onApplyClicked}
          >Apply</Button>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles['input-group']}>
          <div className={styles['input-meta']}>
            <Label
              htmlFor={aggregationCommentModeId}
              id={aggregationCommentModeLabelId}
            >Comment Mode</Label>
            <Description id={aggregationCommentModeDescriptionId}>
              When enabled, adds helper comments to each stage. Only applies to
              new stages.
            </Description>
          </div>
          <div className={styles['input-control']}>
            <Checkbox
              id={aggregationCommentModeId}
              aria-labelledby={aggregationCommentModeLabelId}
              aria-describedby={aggregationCommentModeDescriptionId}
              type="checkbox"
              checked={commentModeChecked}
              onChange={toggleSettingsIsCommentMode}
            />
          </div>
        </div>
        <div className={styles['input-group']}>
          <div className={styles['input-meta']}>
            <Label
              htmlFor={aggregationSampleSizeId}
              id={aggregationSampleSizeLabelId}
            >Number of Preview Documents</Label>
            <Description id={aggregationSampleSizeDescriptionId}>Specify the number of documents to show in the preview.</Description>
          </div>
          <div className={styles['input-control']}>
            <TextInput
              id={aggregationSampleSizeId}
              aria-labelledby={aggregationSampleSizeLabelId}
              aria-describedby={aggregationSampleSizeDescriptionId}
              type="number"
              min="0"
              placeholder={`${DEFAULT_SAMPLE_SIZE}`}
              value={`${sampleSize}`}
              onChange={onSampleSizeChanged}
            />
          </div>
        </div>
        {!isAtlasDeployed && (
          <div className={styles['input-group']}>
            <div className={styles['input-meta']}>
              <Label
                htmlFor={aggregationLimitId}
                id={aggregationLimitLabelId}
              >Limit</Label>
              <div id={aggregationLimitDescriptionId}>
                <Description>
                  Limits input documents before $group, $bucket, and $bucketAuto
                  stages. Set a limit to make the preview run faster.
                </Description>
                <Description>
                  Note: this setting is only applied for the document previews, it
                  is not applied when the pipeline is run.
                </Description>
              </div>
            </div>
            <div className={styles['input-control']}>
              <TextInput
                id={aggregationLimitId}
                aria-labelledby={aggregationLimitLabelId}
                aria-describedby={aggregationLimitDescriptionId}
                type="number"
                min="0"
                placeholder={`${DEFAULT_LARGE_LIMIT}`}
                value={`${aggregationLimit}`}
                onChange={onLimitChanged}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
