import React from 'react';
import { mount } from 'enzyme';

import Favorites from './favorites';

import styles from './sidebar.module.less';

describe('Favorites [Component]', () => {
  context('when the connection has no color', () => {
    const favorites = {
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40': {
        name: 'myconn',
        isFavorite: true
      }
    };
    let component;

    beforeEach(() => {
      component = mount(
        <Favorites connectionModel={{}} connections={favorites} />
      );
    });

    it('renders the header', () => {
      const style = `.${styles['connect-sidebar-header']}`;

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

    it('sets a default color for the right border', () => {
      const favorite = component.find(`.${styles['connect-sidebar-list-item']}`);

      expect(favorite.prop('style')).to.deep.equal({ borderRight: '5px solid transparent' });
    });
  });

  context('when the connection has a custom color', () => {
    const favorites = {
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40': {
        name: 'myconn',
        isFavorite: true,
        color: '#2c5f4a'
      }
    };
    let component;

    beforeEach(() => {
      component = mount(
        <Favorites connectionModel={{}} connections={favorites} />
      );
    });

    it('sets a default color for the right border ', () => {
      const favorite = component.find(`.${styles['connect-sidebar-list-item']}`);

      expect(favorite.prop('style')).to.deep.equal({ borderRight: '5px solid #2c5f4a' });
    });
  });

  context('multiple favorites', () => {
    const favorites = {
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40': {
        name: 'second',
        isFavorite: true,
        color: '#2c5f4a'
      },
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f41': {
        name: 'third',
        isFavorite: true,
        color: '#2c5f4a'
      },
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f42': {
        name: 'first',
        isFavorite: true,
        color: '#2c5f4a'
      }
    };

    it('renders them in alphabetical order', () => {
      const component = mount(
        <Favorites connectionModel={{}} connections={favorites} />
      );

      const style = `.${styles['connect-sidebar-list-item-name']}`;

      expect(component.find(style).at(0).text()).to.be.equal('first');
      expect(component.find(style).at(2).text()).to.be.equal('third');
    });
  });
});
