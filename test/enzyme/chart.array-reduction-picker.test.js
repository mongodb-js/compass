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
      expect(component.find('.chart-draggable-field-title')).to.have.text('MagicLetters');
    });

    it('displays the type', () => {
      expect(component.find('.chart-draggable-field-action-title')).to.have.text('concat');
    });

    it('contains default class when no type is specified', () => {
      expect(component.find('.chart-draggable-field-action.chart-draggable-field-action-reduction'))
        .to.have.className('chart-draggable-field-action-default');
    });
  });

  context('when no type is set', () => {
    beforeEach(() => {
      component = shallow(<ArrayReductionPicker />);
    });

    it('displays "choose method"', () => {
      expect(component.find('.chart-draggable-field-action-title')).to.have.text('Choose method');
    });

    it('contains primary class when no type is specified', () => {
      expect(component.find('.chart-draggable-field-action.chart-draggable-field-action-reduction'))
        .to.have.className('chart-draggable-field-action-primary');
    });
  });
});
