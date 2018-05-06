const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const ReplicaSet = require('../../src/components/replica-set');
const ServerType = require('../../src/models/server-type');
const TopologyType = require('../../src/models/topology-type');

chai.use(chaiEnzyme);

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
        expect(node).to.have.text('test');
      });

      it('renders the replica set icon', () => {
        const node = component.find('.mms-icon-replica-set');
        expect(node).to.be.present();
      });

      it('renders the node count', () => {
        const node = component.find('.topology-replica-set-nodes');
        expect(node).to.have.text('1 node');
      });

      it('renders the replica set text', () => {
        const node = component.find('.topology-replica-set-type-name');
        expect(node).to.have.text('Replica Set');
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
        expect(node).to.have.text('test');
      });

      it('renders the replica set icon', () => {
        const node = component.find('.mms-icon-replica-set');
        expect(node).to.be.present();
      });

      it('renders the node count', () => {
        const node = component.find('.topology-replica-set-nodes');
        expect(node).to.have.text('2 nodes');
      });

      it('renders the replica set text', () => {
        const node = component.find('.topology-replica-set-type-name');
        expect(node).to.have.text('Replica Set');
      });
    });
  });
});
