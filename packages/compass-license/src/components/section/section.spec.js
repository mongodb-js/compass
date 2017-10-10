import React from 'react';
import { mount } from 'enzyme';

import Section from 'components/section';
import styles from './section.less';

describe('Section [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Section title="title" text="text" index={0} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the title', () => {
    expect(component.find(`.${styles['section-body-item-title']}`)).
      to.have.text('1. title.');
  });

  it('renders the text', () => {
    expect(component.find(`.${styles['section-body-item-text']}`)).
      to.have.text('text');
  });
});
