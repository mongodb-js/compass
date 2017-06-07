const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const Unknown = require('../../src/components/unknown');
const ServerType = require('../../src/models/server-type');

describe('<Unknown />', () => {
  describe('#render', () => {
    context('when the set has 1 node', () => {
      const servers = [{ address: '127.0.0.1:27017', type: ServerType.RS_PRIMARY }];
      const component = shallow(<Unknown servers={servers} />);

      it('renders the name', () => {
        const node = component.find('.topology-unknown-name');
        expect(node.children().node).to.equal('Unknown');
      });

      it('renders the unknown icon', () => {
        const node = component.find('.mms-icon-unknown');
        expect(node).to.have.length(1);
      });

      it('renders the node count', () => {
        const node = component.find('.topology-unknown-nodes');
        expect(node.children().node).to.equal('1 server');
      });

      it('renders the unknown text', () => {
        const node = component.find('.topology-unknown-type-name');
        expect(node.children().node).to.equal('Unknown');
      });
    });

    context('when the set has more than 1 node', () => {
      const servers = [
        { address: '127.0.0.1:27017', type: ServerType.RS_PRIMARY },
        { address: '127.0.0.1:27018', type: ServerType.RS_SECONDARY }
      ];
      const component = shallow(<Unknown servers={servers} />);

      it('renders the name', () => {
        const node = component.find('.topology-unknown-name');
        expect(node.children().node).to.equal('Unknown');
      });

      it('renders the unknown icon', () => {
        const node = component.find('.mms-icon-unknown');
        expect(node).to.have.length(1);
      });

      it('renders the node count', () => {
        const node = component.find('.topology-unknown-nodes');
        expect(node.children().node).to.equal('2 servers');
      });

      it('renders the unknown text', () => {
        const node = component.find('.topology-unknown-type-name');
        expect(node.children().node).to.equal('Unknown');
      });
    });
  });
});
