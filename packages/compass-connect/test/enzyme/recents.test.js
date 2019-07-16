const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const Recents = require('../../lib/components/sidebar/recents');

chai.use(chaiEnzyme());

describe('<Recents />', () => {
  describe('#render', () => {
    const recents = [{ hostname: 'dev', port: 27000, is_recent: true, isFavorite: false}];
    const component = mount(
      <Recents currentConnection={{}} connections={recents} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.connect-sidebar-connections-recents')).to.be.present();
    });

    it('renders the header', () => {
      expect(component.find('.connect-sidebar-header')).to.be.present();
    });

    it('renders the recents icon', () => {
      expect(component.find('i.fa-history')).to.be.present();
    });

    it('renders clear all connections text', () => {
      expect(component.find('.connect-sidebar-header-recent-clear')).to.have.text('Clear All');
    });

    it('renders clear individual connection icon', () => {
      expect(component.find('.fa.fa-trash-o.fa-lg')).to.be.present();
    });

    it('renders the recent name', () => {
      expect(component.find('.connect-sidebar-list-item-name')).to.have.text('dev:27000');
    });

    it('renders the recent lastUsed ', () => {
      expect(component.find('.connect-sidebar-list-item-last-used')).to.have.text('Never');
    });
  });
});
