/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');

const { shallow } = require('enzyme');

const ArrayReductionPicker = require('../../src/internal-packages/chart/lib/components/array-reduction-picker');
const { ARRAY_STRING_REDUCTIONS } = require('../../src/internal-packages/chart/lib/constants');

chai.use(chaiEnzyme());

describe('<ArrayReductionPicker />', () => {
  let component;
  context('when dimensionality=1 and setting a label and type', () => {
    beforeEach(() => {
      component = shallow(<ArrayReductionPicker
        dimensionality={1}
        field="MagicLetters"
        type="concat"
      />);
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

  // 321 is not particularly special, it's just a big-ish number
  context('when dimensionality=321', () => {
    beforeEach(() => {
      component = shallow(<ArrayReductionPicker
        dimensionality={321}
        field="MagicLetters"
        type={ARRAY_STRING_REDUCTIONS.CONCAT}
      />);
    });

    it('has 321 [] icons present', () => {
      expect(component.find('i.mms-icon-array')).to.have.length(321);
    });
  });

  context('when no type is set', () => {
    beforeEach(() => {
      component = shallow(<ArrayReductionPicker
        dimensionality={1}
      />);
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
