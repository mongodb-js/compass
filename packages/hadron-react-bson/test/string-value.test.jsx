const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { StringValue } = require('../');

describe('<StringValue /> (rendering string)', () => {
  context('when the string is short', () => {
    const component = shallow(<StringValue type="String" value="testing" />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-string')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('testing');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('\"testing\"');
    });
  });

  context('when the string is long', () => {
    const string = 'adfgdjfahgsdfadhfgadkfgkdfghdsjgfkdsahjfgdkasjhfgdasjkfhgdakjfhdgsfkajdshgfkjdashg' +
      'akhjsdgfkasdjfhgsadfkjhgdasfkjagdsfkasdjhfgfskgdhfg';
    const component = shallow(<StringValue type="String" value={string} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-string')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal(string);
    });

    it('sets the value', () => {
      const expected = '\"adfgdjfahgsdfadhfgadkfgkdfghdsjgfkdsahjfgdkasjhfgdasjkfhgdakjfhdgsfkaj...\"';
      expect(component.text()).to.equal(expected);
    });
  });
});
