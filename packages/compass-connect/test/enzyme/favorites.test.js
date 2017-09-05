const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const Favorites = require('../../lib/components/sidebar/favorites');

chai.use(chaiEnzyme());

describe('<Favorites />', () => {
  describe('#render', () => {
    const favorites = [{ name: 'myconn', is_favorite: true }];
    const component = mount(
      <Favorites currentConnection={{}} connections={favorites} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.connect-sidebar-connections-favorites')).to.be.present();
    });

    it('renders the header', () => {
      expect(component.find('.connect-sidebar-header')).to.be.present();
    });

    it('renders the favorites icon', () => {
      expect(component.find('i.fa-star')).to.be.present();
    });

    it('renders the favorite name', () => {
      expect(component.find('.connect-sidebar-list-item-name')).to.have.text('myconn');
    });

    it('renders the favorite last_used ', () => {
      expect(component.find('.connect-sidebar-list-item-last-used')).to.have.text('Never');
    });
  });
});
