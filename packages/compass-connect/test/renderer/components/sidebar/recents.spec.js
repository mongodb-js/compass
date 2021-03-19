import React from 'react';
import { mount } from 'enzyme';

import Recents from '../../../../src/components/sidebar/recents';
import Actions from '../../../../src/actions';

import styles from '../../../../src/components/sidebar/sidebar.less';

const delay = (amt) => new Promise((resolve) => setTimeout(resolve, amt));

describe('Recents [Component]', () => {
  context('when a connection is double clicked', () => {
    const recents = {
      '674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40': {
        hostname: 'dev',
        port: 27000,
        isRecent: true,
        isFavorite: false
      }
    };
    let component;
    let fakeSinonSelectAndConnect;

    beforeEach(async() => {
      component = mount(<Recents
        connectionModel={{}}
        connections={recents}
      />);

      fakeSinonSelectAndConnect = sinon.fake();
      sinon.replace(
        Actions,
        'onConnectionSelectAndConnect',
        fakeSinonSelectAndConnect
      );

      component.find(
        `.${styles['connect-sidebar-list-item']}`
      ).simulate('doubleclick');

      // Give time for the double click to invoke the store action (immediate).
      await delay(20);
    });

    afterEach(() => {
      component = null;
      sinon.restore();
    });

    it('calls the onConnectionSelectAndConnect action with the connection', () => {
      expect(fakeSinonSelectAndConnect.called).to.equal(true);
      expect(fakeSinonSelectAndConnect.firstCall.args[0]).to.deep.equal(
        recents['674f5a6b-f4ba-4e5c-a5c8-f557fdc06f40']
      );
    });
  });
});
