/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const { mount } = require('enzyme');

const ArrayReductionArg = require('../../src/internal-packages/chart/lib/components/array-reduction-arg');

chai.use(chaiEnzyme());

describe('<ArrayReductionArg />', () => {
  const validateError = () => {
    throw new Error('ValidationError - oops');
  };
  const validateUnmodified = () => {
    return 0;
  };
  const onBlur = () => {};  // Perhaps use a sinon.spy() to improve coverage
  let component;

  context('"Array element by index"', () => {
    context('with an error validator', () => {
      beforeEach(() => {
        component = mount(<ArrayReductionArg
          label="Index"
          onBlur={onBlur}
          validator={validateError}
        />);
      });
      it('determines an appropriate error validation state', () => {
        const errorsFound = component.find('.has-error');
        expect(errorsFound).to.have.length(1);
      });
    });

    context('with a label and unmodified validator', () => {
      beforeEach(() => {
        component = mount(<ArrayReductionArg
          label="Index"
          onBlur={onBlur}
          validator={validateUnmodified}
        />);
      });

      it('displays a label for this argument', () => {
        const label = component.find('.chart-draggable-field-row-reduction-arg-label');
        expect(label.text()).to.be.equal('Index');
      });
      it('determines no error validation state', () => {
        const errorsFound = component.find('.has-error');
        expect(errorsFound).to.have.length(0);
      });
    });
  });
});
