const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const ReadPreferenceSelect = require('../../lib/components/form/read-preference-select');

chai.use(chaiEnzyme());

describe('<ReadPreferenceSelect />', () => {
  describe('#render', () => {
    const component = mount(
      <ReadPreferenceSelect readPreference="secondary" />
    );

    it('renders the read preference', () => {
      expect(component.find('select')).to.have.value('secondary');
    });
  });
});
