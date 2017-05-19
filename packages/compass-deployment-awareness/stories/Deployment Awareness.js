import React from 'react';
import { storiesOf } from '@kadira/storybook';
import DeploymentAwarenessComponent from '../src/components/Deployment Awareness';
import ConnectedDeploymentAwarenessComponent from '../src/components/';

storiesOf('DeploymentAwarenessComponent', module)
  .add('connected to store', () => <ConnectedDeploymentAwarenessComponent />)
  .add('enabled', () => <DeploymentAwarenessComponent status="enabled" />)
  .add('disabled', () => <DeploymentAwarenessComponent status="disabled" />);
