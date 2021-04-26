import React from 'react';
import { mount } from 'enzyme';

import Recents from './recents';

import styles from './sidebar.less';

describe('Recents [Component]', () => {
  describe('when rendered', () => {
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
      component = mount(<Recents connectionModel={{}} connections={recents} />);
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

  describe('when rendered with multiple recents', () => {
    const now = Date.now();

    const recents = {
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40': {
        hostname: 'dev1',
        port: 27000,
        isRecent: true,
        isFavorite: false,
        lastUsed: (now + 1)
      },
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f41': {
        hostname: 'dev2',
        port: 27000,
        isRecent: true,
        isFavorite: false,
        lastUsed: undefined // This field didn't used to exist.
      },
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f42': {
        hostname: 'dev3',
        port: 27000,
        isRecent: true,
        isFavorite: false,
        lastUsed: (now + 2)
      },
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f43': {
        hostname: 'dev4',
        port: 27000,
        isRecent: true,
        isFavorite: false,
        lastUsed: (now - 1)
      }
    };

    it('renders them in descending order from lastUsed date', () => {
      const component = mount(<Recents
        connectionModel={{}}
        connections={recents}
      />);

      const style = `.${styles['connect-sidebar-list-item-name']}`;

      expect(component.find(style).at(0).text()).to.equal('dev3:27000');
      expect(component.find(style).at(1).text()).to.equal('dev1:27000');
      expect(component.find(style).at(2).text()).to.equal('dev4:27000');
      expect(component.find(style).at(3).text()).to.equal('dev2:27000');
    });
  });
});
