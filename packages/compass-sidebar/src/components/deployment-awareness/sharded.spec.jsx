import React from 'react';
import { shallow } from 'enzyme';
import Sharded from './sharded';
import { expect } from 'chai';

import styles from './sharded.module.less';

const MONGOS = 'Mongos';

describe('<Sharded />', function () {
  describe('#render', function () {
    context('when the cluster has 1 mongos', function () {
      const servers = [{ address: '127.0.0.1:27017', type: MONGOS }];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the mongos count', function () {
        const node = component.find(
          `.${styles['topology-sharded-cluster-nodes']}`
        );
        expect(node).to.have.text('1 Mongos');
      });

      it('renders the sharded cluster text', function () {
        const node = component.find(
          `.${styles['topology-sharded-cluster-name']}`
        );
        expect(node).to.have.text('Sharded');
      });
    });

    context('when the cluster has more than 1 mongos', function () {
      const servers = [
        { address: '127.0.0.1:27017', type: MONGOS },
        { address: '127.0.0.1:27018', type: MONGOS },
      ];
      const component = shallow(<Sharded servers={servers} />);

      it('renders the mongos count', function () {
        const node = component.find(
          `.${styles['topology-sharded-cluster-nodes']}`
        );
        expect(node).to.have.text('2 Mongoses');
      });

      it('renders the sharded cluster text', function () {
        const node = component.find(
          `.${styles['topology-sharded-cluster-name']}`
        );
        expect(node).to.have.text('Sharded');
      });
    });
  });
});
