const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const NoAction = require('../../src/components/no-action');

chai.use(chaiEnzyme());

describe('<NoAction />', () => {
  describe('#render', () => {
    const component = shallow(<NoAction />);

    it('returns an empty div', () => {
      expect(component.find('div')).to.have.className('editable-element-actions');
    });
  });
});
