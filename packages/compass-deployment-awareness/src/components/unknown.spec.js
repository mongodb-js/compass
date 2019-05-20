import React from 'react';
import { shallow } from 'enzyme';
import Unknown from 'components/unknown';
import {
  RS_PRIMARY,
  RS_SECONDARY
} from 'models/server-type';

import styles from './unknown.less';

describe('<Unknown />', () => {
  describe('#render', () => {
    context('when the set has 1 node', () => {
      const servers = [{ address: '127.0.0.1:27017', type: RS_PRIMARY }];
      const component = shallow(<Unknown servers={servers} isDataLake={false} />);

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-unknown-name']}`);
        expect(node).to.have.text('Unknown');
      });

      it('renders the unknown icon', () => {
        const node = component.find('.mms-icon-unknown');
        expect(node).to.be.present();
      });

      it('renders the node count', () => {
        const node = component.find(`.${styles['topology-unknown-nodes']}`);
        expect(node).to.have.text('1 server');
      });

      it('renders the unknown text', () => {
        const node = component.find(`.${styles['topology-unknown-type-name']}`);
        expect(node).to.have.text('Unknown');
      });
    });

    context('when the set has more than 1 node', () => {
      const servers = [
        { address: '127.0.0.1:27017', type: RS_PRIMARY },
        { address: '127.0.0.1:27018', type: RS_SECONDARY }
      ];
      const component = shallow(<Unknown servers={servers} isDataLake={false} />);

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-unknown-name']}`);
        expect(node).to.have.text('Unknown');
      });

      it('renders the unknown icon', () => {
        const node = component.find('.mms-icon-unknown');
        expect(node).to.be.present();
      });

      it('renders the node count', () => {
        const node = component.find(`.${styles['topology-unknown-nodes']}`);
        expect(node).to.have.text('2 servers');
      });

      it('renders the unknown text', () => {
        const node = component.find(`.${styles['topology-unknown-type-name']}`);
        expect(node).to.have.text('Unknown');
      });
    });

    context('connected to DataLake', () => {
      const servers = [{ address: '127.0.0.1:27017', type: RS_PRIMARY }];
      const component = shallow(<Unknown servers={servers} isDataLake />);

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-unknown-name']}`);
        expect(node).to.have.text('Unknown');
      });

      it('renders the node count', () => {
        const node = component.find(`.${styles['topology-unknown-nodes']}`);
        expect(node).to.have.text('1 server');
      });

      it('renders the unknown text', () => {
        const node = component.find(`.${styles['topology-unknown-type-name']}`);
        expect(node).to.be.not.present();
      });
    });
  });
});
