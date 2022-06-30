import React from 'react';
import { shallow } from 'enzyme';
import ReplicaSet from './replica-set';
import ServerType from '../../models/server-type';
import TopologyType from '../models/topology-type';

import styles from './replica-set.module.less';

describe('<ReplicaSet />', () => {
  describe('#render', () => {
    context('when the set has 1 node', () => {
      const servers = [{ address: '127.0.0.1:27017', type: ServerType.RS_PRIMARY }];
      const component = shallow(
        <ReplicaSet
          setName="test"
          servers={servers}
          topologyType={TopologyType.REPLICA_SET_WITH_PRIMARY} />
      );

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-replica-set-cluster-name']}`);
        expect(node).to.have.text('Replica Set (test)');
      });

      it('renders the node count', () => {
        const node = component.find(`.${styles['topology-replica-set-cluster-nodes']}`);
        expect(node).to.have.text('1 Node');
      });
    });

    context('when the set has more than 1 node', () => {
      const servers = [
        { address: '127.0.0.1:27017', type: ServerType.RS_PRIMARY },
        { address: '127.0.0.1:27018', type: ServerType.RS_SECONDARY }
      ];
      const component = shallow(
        <ReplicaSet
          setName="test"
          servers={servers}
          topologyType={TopologyType.REPLICA_SET_WITH_PRIMARY} />
      );

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-replica-set-cluster-name']}`);
        expect(node).to.have.text('Replica Set (test)');
      });

      it('renders the node count', () => {
        const node = component.find(`.${styles['topology-replica-set-cluster-nodes']}`);
        expect(node).to.have.text('2 Nodes');
      });
    });
  });
});
