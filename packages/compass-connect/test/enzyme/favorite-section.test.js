const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const FavoriteSection = require('../../src/components/favorite-section');

chai.use(chaiEnzyme());

describe('<FavoriteSection />', () => {
  describe('#render', () => {
    const connection = {
      name: 'myconnection'
    };
    const component = mount(
      <FavoriteSection currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the name', () => {
      expect(component.find('input[name="favorite_name"]')).to.have.value('myconnection');
    });
  });
});
