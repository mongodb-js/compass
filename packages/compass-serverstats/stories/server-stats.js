import React from 'react';
import { storiesOf } from '@kadira/storybook';
import ServerStats from '../src/components/index';

storiesOf('ServerStats', module)
  .add('default', () => <ServerStats interval={10}/>);
