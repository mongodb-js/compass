const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { OptionSelector } = require('../');

describe('<OptionSelector />', () => {
  context('when the option selector has no label', () => {
    const options = {
      'LINE': 'line'
    }
    const onSelect = () => {};
    const component = shallow(
      <OptionSelector id="selector" bsSize="xs" options={options} title="test" onSelect={onSelect} />
    );

    it('sets the base class', () => {
      expect(component.hasClass('option-selector')).to.equal(true);
    });
  });

  context('when the option selector has a label', () => {
    const options = {
      'LINE': 'line'
    }
    const onSelect = () => {};
    const component = shallow(
      <OptionSelector
        id="selector"
        bsSize="xs"
        options={options}
        title="test"
        label="label"
        onSelect={onSelect} />
    );

    it('sets the label', () => {
      expect(component.find('.option-selector-label')).to.have.length(1);
    });

    it('sets the label text', () => {
      expect(component.find('.option-selector-label').text()).to.equal('label');
    });
  });
});
