const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const AtlasLink = require('../../lib/components/sidebar/atlas-link');

chai.use(chaiEnzyme());

describe('<AtlasLink />', () => {
  describe('#render', () => {
    const component = mount(
      <AtlasLink />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.connect-sidebar-atlas-link')).to.be.present();
    });

    it('renders the header', () => {
      expect(component.find('.connect-sidebar-header')).to.be.present();
    });

    it('renders the create atlas cluster icon', () => {
      expect(component.find('i.fa-external-link')).to.be.present();
    });

    it('renders the new connection text', () => {
      expect(component.find('span')).to.have.text('Create Atlas Cluster');
    });
  });
});
