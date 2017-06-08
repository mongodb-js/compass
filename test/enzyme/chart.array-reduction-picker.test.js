/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const Dropdown = require('react-bootstrap').Dropdown;

const shallow = require('enzyme').shallow;

const ArrayReductionPicker = require('../../src/internal-packages/chart/lib/components/array-reduction-picker');

chai.use(chaiEnzyme());

describe('<ArrayReductionPicker />', () => {
  let component;
  context('when setting a label and type', () => {
    beforeEach(() => {
      component = shallow(<ArrayReductionPicker field="MagicLetters" type="concat" />);
    });

    it('displays the label', () => {
      expect(component.find('.chart-draggable-field-array-picker .chart-draggable-field-title')).to.have.text('MagicLetters');
    });

    it('displays the type', () => {
      expect(component.find('.chart-draggable-field-array-picker-title-name')).to.have.text('concat');
    });
  });

  context('when no type is set', () => {
    beforeEach(() => {
      component = shallow(<ArrayReductionPicker />);
    });

    it('displays "choose method"', () => {
      expect(component.find('.chart-draggable-field-array-picker-title-name')).to.have.text('Choose method');
    });

    it('contains unselected class when no type is specified', () => {
      expect(component.find('.chart-draggable-field-array-picker-dropdown'))
        .to.have.className('btn-primary');
    });
  });
});
