import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from 'storybook/decorators';

// import { Provider } from 'react-redux';
// import { INITIAL_STATE } from 'modules';
// import { configureStore } from 'utils/configureStore';

import { action } from '@storybook/addon-actions';

const PROPS = {
  isOpen: false,
  isSaveAs: false,
  name: '',
  savingPipelineCancel: action('savingPipelineCancel'),
  savingPipelineApply: action('savingPipelineApply'),
  savingPipelineNameChanged: action('savingPipelineNameChanged'),
  saveCurrentPipeline: action('saveCurrentPipeline')
};

import SavingPipelineModal from 'components/saving-pipeline-modal';

storiesOf('Components/SavingPipelineModal', module)
  .addDecorator(story => <ComponentPreview>{story()}</ComponentPreview>)
  .add('isOpen', () => {
    const props = {
      ...PROPS,
      isOpen: true
    };
    return (
      <SavingPipelineModal {...props} />
    );
  })
  .add('isOpen > name', () => {
    const props = {
      ...PROPS,
      name: 'Joys Pipeline',
      isOpen: true
    };
    return (
      <SavingPipelineModal {...props} />
    );
  })
  .add('isOpen > isSaveAs', () => {
    const props = {
      ...PROPS,
      isOpen: true,
      name: 'Joys Pipeline',
      isSaveAs: true
    };
    return (
      <SavingPipelineModal {...props} />
    );
  })
  .add('Default', () => {
    const props = {
      ...PROPS
    };
    return (
      <SavingPipelineModal {...props} />
    );
  })
  ;
