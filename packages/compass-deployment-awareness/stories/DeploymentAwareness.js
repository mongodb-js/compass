import React from 'react';
import { storiesOf } from '@kadira/storybook';
import DeploymentAwareness from '../src/components/deployment-awareness';

const SERVERS = {
  'Standalone': [
    { type: 'Standalone', address: '127.0.0.1:27017' }
  ],
  'ReplicaSetNoPrimary': [
    { type: 'RSSecondary', address: '127.0.0.1:27017' },
    { type: 'RSSecondary', address: '127.0.0.1:27018' },
    { type: 'RSSecondary', address: '127.0.0.1:27019' }
  ],
  'ReplicaSetWithPrimary': [
    { type: 'RSPrimary', address: '127.0.0.1:27017' },
    { type: 'RSSecondary', address: '127.0.0.1:27018' },
    { type: 'RSSecondary', address: '127.0.0.1:27019' }
  ],
  'Sharded': [
    { type: 'Mongos', address: '127.0.0.1:27018' },
    { type: 'Mongos', address: '127.0.0.1:27019' }
  ],
  'Unknown': [
    { type: 'Unknown', address: '127.0.0.1:27017' }
  ]
};

storiesOf('DeploymentAwarenessComponent', module)
  .add('Standalone', () => <DeploymentAwareness topologyType='Standalone' servers={SERVERS['Standalone']} />)
  .add('ReplicaSetNoPrimary', () => <DeploymentAwareness topologyType='ReplicaSetNoPrimary' setName='test' servers={SERVERS['ReplicaSetNoPrimary']} />)
  .add('ReplicaSetWithPrimary', () => <DeploymentAwareness topologyType='ReplicaSetWithPrimary' setName='test' servers={SERVERS['ReplicaSetWithPrimary']} />)
  .add('Sharded', () => <DeploymentAwareness topologyType='Sharded' servers={SERVERS['Sharded']} />)
  .add('Unknown', () => <DeploymentAwareness topologyType='Unknown' servers={SERVERS['Unknown']} />);
