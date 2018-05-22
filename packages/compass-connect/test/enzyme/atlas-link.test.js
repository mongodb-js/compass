const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const AtlasLink = require('../../lib/components/atlas-link');

chai.use(chaiEnzyme());

describe('<AtlasLink />', () => {
  describe('#render', () => {
    const component = mount(
      <AtlasLink />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.connect-atlas-link')).to.be.present();
    });
  });
});
