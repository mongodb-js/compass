const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const Single = require('../../src/components/single');
const ServerType = require('../../src/models/server-type');

describe('<Single />', () => {
  describe('#render', () => {
    context('when the server is standalone', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.STANDALONE };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Standalone');
      });
    });

    context('when the server is a primary', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.RS_PRIMARY };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Primary');
      });
    });

    context('when the server is a secondary', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.RS_SECONDARY };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Secondary');
      });
    });

    context('when the server is an arbiter', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.RS_ARBITER };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Arbiter');
      });
    });

    context('when the server is a ghost', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.RS_GHOST };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Ghost');
      });
    });

    context('when the server is unknown', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.UNKNOWN };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Unknown');
      });
    });

    context('when the server is an other', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.RS_OTHER };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Other');
      });
    });

    context('when the server is a possible primary', () => {
      const server = { address: '127.0.0.1:27017', type: ServerType.POSSIBLE_PRIMARY };
      const component = shallow(<Single server={server} />);

      it('renders the address', () => {
        const node = component.find('.topology-single-address');
        expect(node.children().node).to.equal('127.0.0.1:27017');
      });

      it('renders the humanized type', () => {
        const node = component.find('.topology-single-type');
        expect(node.children().node).to.equal('Possible Primary');
      });
    });
  });
});
