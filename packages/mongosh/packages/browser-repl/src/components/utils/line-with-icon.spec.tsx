import React from 'react';
import { expect } from '../../../testing/chai';
import { shallow } from '../../../testing/enzyme';
import { LineWithIcon } from './line-with-icon';

describe('<LineWithIcon />', () => {
  const Icon: React.FunctionComponent = () => <span />;

  it('renders children element', () => {
    const wrapper = shallow(<LineWithIcon icon={<Icon />}>some text</LineWithIcon>);
    expect(wrapper.text()).to.contain('some text');
  });

  it('renders the icon', () => {
    const wrapper = shallow(<LineWithIcon icon={<Icon />}>some text</LineWithIcon>);
    expect(wrapper.find(Icon)).to.have.lengthOf(1);
  });

  it('adds className if passed as prop', () => {
    const wrapper = shallow(
      <LineWithIcon className="my-class-name" icon={<Icon />}>some text</LineWithIcon>
    );

    expect(wrapper.hasClass('my-class-name')).to.be.true;
  });
});
