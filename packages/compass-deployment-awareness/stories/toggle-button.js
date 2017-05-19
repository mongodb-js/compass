import React from 'react';
import { storiesOf, linkTo } from '@kadira/storybook';
import ToggleButton from '../src/components/toggle-button';

storiesOf('ToggleButton', module)
  .addWithInfo(
    'without children',
    'By default, the string "Toggle" is displayed on the button.', () => (
    <ToggleButton onClick={linkTo('ToggleButton', 'custom text')} />
  ))
  .addWithInfo(
    'custom text',
    'Other texts can be passed in as children to the component.', () => (
    <ToggleButton onClick={linkTo('ToggleButton')}>Click Me!</ToggleButton>
  ));
