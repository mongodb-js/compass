import React from 'react';
import { mount } from 'enzyme';

import Favorites from '../../../../src/components/sidebar/favorites';
import Actions from '../../../../src/actions';

import styles from '../../../../src/components/sidebar/sidebar.less';

const delay = (amt) => new Promise((resolve) => setTimeout(resolve, amt));

describe('Favorites [Component]', () => {
  context('when a connection is double clicked', () => {
    const favorites = {
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f42': {
        hostname: 'dev',
        port: 27000,
        isFavorite: true
      }
    };
    let component;
    let fakeSinonSelectAndConnect;

    beforeEach(async() => {
      component = mount(<Favorites
        connectionModel={{}}
        connections={favorites}
      />);

      fakeSinonSelectAndConnect = sinon.fake();
      sinon.replace(
        Actions,
        'onConnectionSelectAndConnect',
        fakeSinonSelectAndConnect
      );

      component.find(
        `.${styles['connect-sidebar-list-item']}`
      ).simulate('dblclick');

      // Give time for the double click to invoke the store action (immediate).
      await delay(100);
    });

    afterEach(() => {
      component = null;
      sinon.restore();
    });

    it('calls the onConnectionSelectAndConnect action with the connection', () => {
      expect(fakeSinonSelectAndConnect.called).to.equal(true);
      expect(fakeSinonSelectAndConnect.firstCall.args[0]).to.deep.equal(
        favorites['674f5a6b-f4ba-4e5c-a5c8-f557fdc06f42']
      );
    });
  });
});
