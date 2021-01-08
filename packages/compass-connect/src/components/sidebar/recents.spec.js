import React from 'react';
import { mount } from 'enzyme';

import Recents from './recents';

import styles from './sidebar.less';

describe('Recents [Component]', () => {
  const recents = {
    '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40': {
      hostname: 'dev',
      port: 27000,
      isRecent: true,
      isFavorite: false
    }
  };
  let component;

  beforeEach(() => {
    component = mount(<Recents currentConnection={{}} connections={recents} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    const style = '.connect-sidebar-connections-recents';

    expect(component.find(style)).to.be.present();
  });

  it('renders the header', () => {
    const style = `.${styles['connect-sidebar-header']}`;

    expect(component.find(style)).to.be.present();
  });

  it('renders the recents icon', () => {
    expect(component.find('i.fa-history')).to.be.present();
  });

  it('renders clear all connections text', () => {
    const style = `.${styles['connect-sidebar-header-recent-clear']}`;

    expect(component.find(style)).to.have.text('Clear all');
  });

  it('renders the recent name', () => {
    const style = `.${styles['connect-sidebar-list-item-name']}`;

    expect(component.find(style)).to.have.text('dev:27000');
  });

  it('renders the recent lastUsed ', () => {
    const style = `.${styles['connect-sidebar-list-item-last-used']}`;

    expect(component.find(style)).to.have.text('Never');
  });
});
