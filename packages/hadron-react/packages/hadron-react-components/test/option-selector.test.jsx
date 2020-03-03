import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { OptionSelector } from '../';

describe('<OptionSelector />', () => {
  context('when the option selector has no label', () => {
    const options = {
      'LINE': 'line'
    }
    const onSelect = () => {};
    const component = shallow(
      <OptionSelector id="selector" bsSize="xs" className="selector-class" options={options} title="test" onSelect={onSelect} />
    );

    it('sets the base class', () => {
      expect(component.hasClass('option-selector')).to.equal(true);
    });

    it('sets the button class', () => {
      expect(component.find('#selector').hasClass('selector-class')).to.equal(true);
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
