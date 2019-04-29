import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from 'storybook/decorators';
import PipelineToolbar from 'components/pipeline-toolbar';

import { action } from '@storybook/addon-actions';

const DEFAULTS = {
  serverVersion: '4.0.0',
  savedPipelinesListToggle: action('savedPipelinesListToggle'),
  getSavedPipelines: action('getSavedPipelines'),
  newPipeline: action('newPipeline'),
  newPipelineFromText: action('newPipelineFromText'),
  clonePipeline: action('clonePipeline'),
  exportToLanguage: action('exportToLanguage'),
  saveCurrentPipeline: action('saveCurrentPipeline'),
  savedPipeline: {
    isNameValid: true
  },
  nameChanged: action('nameChanged'),
  toggleComments: action('toggleComments'),
  toggleSample: action('toggleSample'),
  toggleAutoPreview: action('toggleAutoPreview'),
  isModified: false,
  isCommenting: true,
  isSampling: true,
  isAutoPreviewing: true,
  setIsModified: action('setIsModified'),
  name: '',
  collationCollapseToggled: action('collationCollapseToggled'),
  isCollationExpanded: false,
  isOverviewOn: false,
  isFullscreenOn: false,
  toggleOverview: action('toggleOverview'),
  toggleSettingsIsExpanded: action('toggleSettingsIsExpanded'),
  toggleFullscreen: action('toggleFullscreen')
};

storiesOf('Components/PipelineToolbar', module)
  .addDecorator((story) => <ComponentPreview>{story()}</ComponentPreview>)
  .add('Default', () => {
    return <PipelineToolbar {...DEFAULTS} />;
  })
  .add('Views/server@3.2.0', () => {
    const props = {
      ...DEFAULTS,
      serverVersion: '3.2.0'
    };
    return <PipelineToolbar {...props} />;
  });
