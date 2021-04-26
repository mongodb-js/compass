import React from 'react';
import sinon from 'sinon';
import { expect } from '../../../testing/chai';
import { mount } from '../../../testing/enzyme';
import { Expandable } from './expandable';

describe('<Expandable />', () => {
  it('renders children element', () => {
    const wrapper = mount(<Expandable>some text</Expandable>);
    expect(wrapper.text()).to.contain('some text');
  });

  it('renders child function', () => {
    const wrapper = mount(<Expandable>{(): string => 'some text'}</Expandable>);
    expect(wrapper.text()).to.contain('some text');
  });

  it('passes expanded to children', () => {
    const child1 = sinon.spy(() => '');
    mount(<Expandable>{child1}</Expandable>);
    expect(child1).to.have.been.calledWith(false);

    const child2 = sinon.spy(() => '');
    const wrapper = mount(<Expandable>{child2}</Expandable>);
    wrapper.setState({ expanded: true });
    expect(child2).to.have.been.calledWith(true);
  });

  it('passes toggle to children', () => {
    let toggle;

    const wrapper = mount(
      <Expandable>{(expanded, _toggle): void => {toggle = _toggle;}}</Expandable>
    );

    toggle();

    expect(wrapper.state('expanded')).to.be.true;
  });

  it('renders a caret right icon when not expanded', () => {
    const wrapper = mount(<Expandable />);
    expect(wrapper.find('Icon').prop('glyph')).to.equal('CaretRight');
  });

  it('renders a caret down icon when expanded', () => {
    const wrapper = mount(<Expandable />);
    wrapper.setState({ expanded: true });
    expect(wrapper.find('Icon').prop('glyph')).to.equal('CaretDown');
  });
});
