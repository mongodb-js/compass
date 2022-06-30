import React from 'react';
import { shallow } from 'enzyme';
import Sharded from './sharded';
import ServerType from '../../models/server-type';

import styles from './sharded.module.less';

describe('<Sharded />', () => {
  describe('#render', () => {
    context('when the cluster has 1 mongos', () => {
      const servers = [{ address: '127.0.0.1:27017', type: ServerType.MONGOS }];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the mongos count', () => {
        const node = component.find(`.${styles['topology-sharded-cluster-nodes']}`);
        expect(node).to.have.text('1 Mongos');
      });

      it('renders the sharded cluster text', () => {
        const node = component.find(`.${styles['topology-sharded-cluster-name']}`);
        expect(node).to.have.text('Sharded');
      });
    });

    context('when the cluster has more than 1 mongos', () => {
      const servers = [
        { address: '127.0.0.1:27017', type: ServerType.MONGOS },
        { address: '127.0.0.1:27018', type: ServerType.MONGOS }
      ];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the mongos count', () => {
        const node = component.find(`.${styles['topology-sharded-cluster-nodes']}`);
        expect(node).to.have.text('2 Mongoses');
      });

      it('renders the sharded cluster text', () => {
        const node = component.find(`.${styles['topology-sharded-cluster-name']}`);
        expect(node).to.have.text('Sharded');
      });
    });
  });
});
