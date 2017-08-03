import React from 'react';
import { storiesOf } from '@kadira/storybook';
import CompassCrudComponent from '../src/components/Compass CRUD';
import ConnectedCompassCrudComponent from '../src/components/';

storiesOf('CompassCrudComponent', module)
  .add('connected to store', () => <ConnectedCompassCrudComponent />)
  .add('enabled', () => <CompassCrudComponent status="enabled" />)
  .add('disabled', () => <CompassCrudComponent status="disabled" />);
