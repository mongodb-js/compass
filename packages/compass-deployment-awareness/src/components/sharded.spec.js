import React from 'react';
import { shallow } from 'enzyme';
import Sharded from 'components/sharded';
import ServerType from 'models/server-type';

import styles from './sharded.less';

describe('<Sharded />', () => {
  describe('#render', () => {
    context('when the cluster has 1 mongos', () => {
      const servers = [{ address: '127.0.0.1:27017', type: ServerType.MONGOS }];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-sharded-name']}`);
        expect(node).to.have.text('Cluster');
      });

      it('renders the sharded icon', () => {
        const node = component.find('.mms-icon-cluster');
        expect(node).to.be.present();
      });

      it('renders the mongos count', () => {
        const node = component.find(`.${styles['topology-sharded-mongos']}`);
        expect(node).to.have.text('1 mongos');
      });

      it('renders the sharded cluster text', () => {
        const node = component.find(`.${styles['topology-sharded-type-name']}`);
        expect(node).to.have.text('Sharded Cluster');
      });
    });

    context('when the cluster has more than 1 mongos', () => {
      const servers = [
        { address: '127.0.0.1:27017', type: ServerType.MONGOS },
        { address: '127.0.0.1:27018', type: ServerType.MONGOS }
      ];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the name', () => {
        const node = component.find(`.${styles['topology-sharded-name']}`);
        expect(node).to.have.text('Cluster');
      });

      it('renders the sharded icon', () => {
        const node = component.find('.mms-icon-cluster');
        expect(node).to.be.present();
      });

      it('renders the mongos count', () => {
        const node = component.find(`.${styles['topology-sharded-mongos']}`);
        expect(node).to.have.text('2 mongoses');
      });

      it('renders the sharded cluster text', () => {
        const node = component.find(`.${styles['topology-sharded-type-name']}`);
        expect(node).to.have.text('Sharded Cluster');
      });
    });
  });
});
