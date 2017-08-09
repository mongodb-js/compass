import React from 'react';
import { storiesOf } from '@kadira/storybook';
import MongodbJsCompassConnectComponent from '../src/components/@mongodb-js/compass-connect';
import ConnectedMongodbJsCompassConnectComponent from '../src/components/';

storiesOf('MongodbJsCompassConnectComponent', module)
  .add('connected to store', () => <ConnectedMongodbJsCompassConnectComponent />)
  .add('enabled', () => <MongodbJsCompassConnectComponent status="enabled" />)
  .add('disabled', () => <MongodbJsCompassConnectComponent status="disabled" />);
