import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import ReplicaSet from './replica-set';

import styles from './replica-set.module.less';

const RS_PRIMARY = 'RSPrimary';
const RS_SECONDARY = 'RSSecondary';
const REPLICA_SET_WITH_PRIMARY = 'ReplicaSetWithPrimary';

describe('<ReplicaSet />', function () {
  describe('#render', function () {
    context('when the set has 1 node', function () {
      const servers = [{ address: '127.0.0.1:27017', type: RS_PRIMARY }];
      const component = shallow(
        <ReplicaSet
          setName="test"
          servers={servers}
          topologyType={REPLICA_SET_WITH_PRIMARY}
        />
      );

      it('renders the name', function () {
        const node = component.find(
          `.${styles['topology-replica-set-cluster-name']}`
        );
        expect(node).to.have.text('Replica Set (test)');
      });

      it('renders the node count', function () {
        const node = component.find(
          `.${styles['topology-replica-set-cluster-nodes']}`
        );
        expect(node).to.have.text('1 Node');
      });
    });

    context('when the set has more than 1 node', function () {
      const servers = [
        { address: '127.0.0.1:27017', type: RS_PRIMARY },
        { address: '127.0.0.1:27018', type: RS_SECONDARY },
      ];
      const component = shallow(
        <ReplicaSet
          setName="test"
          servers={servers}
          topologyType={REPLICA_SET_WITH_PRIMARY}
        />
      );

      it('renders the name', function () {
        const node = component.find(
          `.${styles['topology-replica-set-cluster-name']}`
        );
        expect(node).to.have.text('Replica Set (test)');
      });

      it('renders the node count', function () {
        const node = component.find(
          `.${styles['topology-replica-set-cluster-nodes']}`
        );
        expect(node).to.have.text('2 Nodes');
      });
    });
  });
});
