import React from 'react';
import { expect } from '../../../testing/chai';
import { shallow } from '../../../testing/enzyme';
import { SyntaxHighlight } from './syntax-highlight';

describe('<SyntaxHighlight />', () => {
  it('renders Syntax', () => {
    const wrapper = shallow(<SyntaxHighlight code={'some code'} />);
    expect(wrapper.find('Syntax')).to.have.lengthOf(1);
  });

  it('passes code to Syntax', () => {
    const wrapper = shallow(<SyntaxHighlight code={'some code'} />);
    expect(wrapper.find('Syntax').children().text()).to.contain('some code');
  });

  it('uses javascript as language', () => {
    const wrapper = shallow(<SyntaxHighlight code={'some code'} />);
    expect(wrapper.find('Syntax').prop('language')).to.equal('javascript');
  });
});
