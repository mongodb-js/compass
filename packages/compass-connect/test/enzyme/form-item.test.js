const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const FormItem = require('../../src/components/form-item');

chai.use(chaiEnzyme());

describe('<FormItem />', () => {
  describe('#render', () => {
    const component = shallow(<FormItem label="Test" name="testing" placeholder="testme" />);

    it('renders the wrapper div', () => {
      expect(component.find('.form-item')).to.be.present();
    });

    it('renders the label', () => {
      expect(component.find('.form-item-label').text()).to.equal('Test');
    });

    it('renders the input name', () => {
      expect(component.find('.form-control').prop('name')).to.equal('testing');
    });

    it('renders the input placeholder', () => {
      expect(component.find('.form-control').prop('placeholder')).to.equal('testme');
    });
  });
});
