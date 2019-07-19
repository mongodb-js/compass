import React from 'react';
import { mount } from 'enzyme';
import NewConnection from './new-connection';

import styles from './sidebar.less';

describe('NewConnection [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<NewConnection currentConnection={{}} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    const style = `.${styles['connect-sidebar-new-connection']}`;

    expect(component.find(style)).to.be.present();
  });

  it('renders the header', () => {
    const style = `.${styles['connect-sidebar-header']}`;

    expect(component.find(style)).to.be.present();
  });

  it('renders the new connection icon', () => {
    expect(component.find('i.fa-bolt')).to.be.present();
  });

  it('renders the new connection text', () => {
    expect(component.find('span')).to.have.text('New Connection');
  });
});
