const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const NewConnectionSection = require('../../src/components/new-connection-section');

chai.use(chaiEnzyme());

describe('<NewConnectionSection />', () => {
  describe('#render', () => {
    const component = mount(
      <NewConnectionSection />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.connect-sidebar-new-connection')).to.be.present();
    });

    it('renders the header', () => {
      expect(component.find('.connect-sidebar-header')).to.be.present();
    });

    it('renders the new connection icon', () => {
      expect(component.find('i.fa-bolt')).to.be.present();
    });

    it('renders the new connection text', () => {
      expect(component.find('span')).to.have.text('New Connection');
    });
  });
});
