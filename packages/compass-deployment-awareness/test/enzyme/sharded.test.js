const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const Sharded = require('../../src/components/sharded');
const ServerType = require('../../src/models/server-type');

describe('<Sharded />', () => {
  describe('#render', () => {
    context('when the cluster has 1 mongos', () => {
      const servers = [{ address: '127.0.0.1:27017', type: ServerType.MONGOS }];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the name', () => {
        const node = component.find('.topology-sharded-name');
        expect(node.children().node).to.equal('Cluster');
      });

      it('renders the sharded icon', () => {
        const node = component.find('.mms-icon-cluster');
        expect(node).to.have.length(1);
      });

      it('renders the mongos count', () => {
        const node = component.find('.topology-sharded-mongos');
        expect(node.children().node).to.equal('1 mongos');
      });

      it('renders the sharded cluster text', () => {
        const node = component.find('.topology-sharded-type-name');
        expect(node.children().node).to.equal('Sharded Cluster');
      });
    });

    context('when the cluster has more than 1 mongos', () => {
      const servers = [
        { address: '127.0.0.1:27017', type: ServerType.MONGOS },
        { address: '127.0.0.1:27018', type: ServerType.MONGOS }
      ];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the name', () => {
        const node = component.find('.topology-sharded-name');
        expect(node.children().node).to.equal('Cluster');
      });

      it('renders the sharded icon', () => {
        const node = component.find('.mms-icon-cluster');
        expect(node).to.have.length(1);
      });

      it('renders the mongos count', () => {
        const node = component.find('.topology-sharded-mongos');
        expect(node.children().node).to.equal('2 mongoses');
      });

      it('renders the sharded cluster text', () => {
        const node = component.find('.topology-sharded-type-name');
        expect(node.children().node).to.equal('Sharded Cluster');
      });
    });
  });
});
