import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from 'storybook/decorators';

import { Provider } from 'react-redux';
import { INITIAL_STATE as BASE_STATE } from 'modules';

import PipelineToolbar from 'components/pipeline-toolbar';
import { configureStore } from 'utils/configureStore';

import BASIC_EXAMPLE from './example-basic.js';

const PROPS = {
  ...BASE_STATE,
  ...BASIC_EXAMPLE
};

import { action } from '@storybook/addon-actions';


storiesOf('Components/PipelineToolbar', module)
  .addDecorator(story => <ComponentPreview>{story()}</ComponentPreview>)
  .add('Default', () => {

    const store = configureStore(PROPS);

    const props = {
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
      toggleFullscreen: action('toggleFullscreen'),
    };
    return (
      <PipelineToolbar {...props}/>
    );
  });
