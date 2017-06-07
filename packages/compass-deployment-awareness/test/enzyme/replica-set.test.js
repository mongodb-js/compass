const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const ReplicaSet = require('../../src/components/replica-set');
const ServerType = require('../../src/models/server-type');
const TopologyType = require('../../src/models/topology-type');

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
        const node = component.find('.topology-replica-set-name');
        expect(node.children().node).to.equal('test');
      });

      it('renders the replica set icon', () => {
        const node = component.find('.mms-icon-replica-set');
        expect(node).to.have.length(1);
      });

      it('renders the node count', () => {
        const node = component.find('.topology-replica-set-nodes');
        expect(node.children().node).to.equal('1 node');
      });

      it('renders the replica set text', () => {
        const node = component.find('.topology-replica-set-type-name');
        expect(node.children().node).to.equal('Replica Set');
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
        const node = component.find('.topology-replica-set-name');
        expect(node.children().node).to.equal('test');
      });

      it('renders the replica set icon', () => {
        const node = component.find('.mms-icon-replica-set');
        expect(node).to.have.length(1);
      });

      it('renders the node count', () => {
        const node = component.find('.topology-replica-set-nodes');
        expect(node.children().node).to.equal('2 nodes');
      });

      it('renders the replica set text', () => {
        const node = component.find('.topology-replica-set-type-name');
        expect(node.children().node).to.equal('Replica Set');
      });
    });
  });
});
