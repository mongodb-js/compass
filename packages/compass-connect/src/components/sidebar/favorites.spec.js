import React from 'react';
import { mount } from 'enzyme';
import Favorites from './favorites';

import styles from './sidebar.less';

describe('Favorites [Component]', () => {
  const favorites = [{ name: 'myconn', isFavorite: true }];
  let component;

  beforeEach(() => {
    component = mount(
      <Favorites currentConnection={{}} connections={favorites} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    const style = '.connect-sidebar-connections-favorites';

    expect(component.find(style)).to.be.present();
  });

  it('renders the header', () => {
    const style = `.${styles['connect-sidebar-header']}`;

    expect(component.find(style)).to.be.present();
  });

  it('renders the favorites icon', () => {
    const style = 'i.fa-star';

    expect(component.find(style)).to.be.present();
  });

  it('renders the favorite name', () => {
    const style = `.${styles['connect-sidebar-list-item-name']}`;

    expect(component.find(style)).to.be.present();
  });

  it('renders the favorite lastUsed ', () => {
    const style = `.${styles['connect-sidebar-list-item-last-used']}`;

    expect(component.find(style)).to.be.present();
  });
});
