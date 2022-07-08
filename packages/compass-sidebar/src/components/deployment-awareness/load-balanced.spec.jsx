import React from 'react';
import { shallow } from 'enzyme';
import LoadBalanced from './load-balanced';
import { expect } from 'chai';

import styles from './load-balanced.module.less';

describe('<LoadBalanced />', function () {
  describe('#render', function () {
    context('when the set has 1 node', function () {
      const server = { address: '127.0.0.1:27017' };
      const component = shallow(<LoadBalanced server={server} />);

      it('renders the load balancer text', function () {
        const node = component.find(
          `.${styles['topology-load-balanced-host-title']}`
        );
        expect(node).to.have.text('HOST (Load Balancer)');
      });
    });
  });
});
