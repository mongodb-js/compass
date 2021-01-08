import React from 'react';
import { mount } from 'enzyme';

import NewConnection from './new-connection';

import styles from './sidebar.less';

describe('NewConnection [Component]', () => {
  context('when a connection is new', () => {
    const currentConnection = {
      _id: '47d5a91a-0920-43e7-a4ef-71430023f484',
      isFavorite: false
    };
    const connections = {
      '6fffae26-e10e-481d-97b5-5c75dc5d628a': {
        _id: '6fffae26-e10e-481d-97b5-5c75dc5d628a',
        isFavorite: false
      },
      '3f2a5083-6e85-47d8-ab13-7c5939a81406': {
        _id: '3f2a5083-6e85-47d8-ab13-7c5939a81406',
        isFavorite: true
      }
    };
    let component;

    beforeEach(() => {
      component = mount(
        <NewConnection
          connections={connections}
          currentConnection={currentConnection} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      const style = `.${styles['connect-sidebar-new-connection']}`;

      expect(component.find(style)).to.be.present();
    });

    it('sets the panel to active', () => {
      const style = `.${styles['connect-sidebar-new-connection-is-active']}`;

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

  context('when a connection is favorite', () => {
    const currentConnection = {
      _id: '47d5a91a-0920-43e7-a4ef-71430023f484',
      isFavorite: true
    };
    const connections = {
      '6fffae26-e10e-481d-97b5-5c75dc5d628a': { isFavorite: false },
      '47d5a91a-0920-43e7-a4ef-71430023f484': { isFavorite: true }
    };
    let component;

    beforeEach(() => {
      component = mount(
        <NewConnection
          connections={connections}
          currentConnection={currentConnection} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not highlight the panel', () => {
      const style = `.${styles['connect-sidebar-new-connection-is-active']}`;

      expect(component.find(style)).to.not.be.present();
    });
  });

  context('when a connection is recent', () => {
    const currentConnection = {
      _id: '47d5a91a-0920-43e7-a4ef-71430023f484',
      isFavorite: false
    };
    const connections = {
      '6fffae26-e10e-481d-97b5-5c75dc5d628a': { isFavorite: false },
      '47d5a91a-0920-43e7-a4ef-71430023f484': { isFavorite: true }
    };
    let component;

    beforeEach(() => {
      component = mount(
        <NewConnection
          connections={connections}
          currentConnection={currentConnection} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not highlight the panel', () => {
      const style = `.${styles['connect-sidebar-new-connection-is-active']}`;

      expect(component.find(style)).to.not.be.present();
    });
  });
});
