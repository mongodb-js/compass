import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Unknown from './unknown';

import styles from './unknown.module.less';

const RS_PRIMARY = 'RSPrimary';
const RS_SECONDARY = 'RSSecondary';

describe('<Unknown />', function () {
  describe('#render', function () {
    context('when the set has 1 node', function () {
      const servers = [{ address: '127.0.0.1:27017', type: RS_PRIMARY }];
      const component = shallow(
        <Unknown servers={servers} isDataLake={false} />
      );

      it('renders the node count', function () {
        const node = component.find(
          `.${styles['topology-unknown-cluster-nodes']}`
        );
        expect(node).to.have.text('1 Server');
      });

      it('renders the unknown text', function () {
        const node = component.find(
          `.${styles['topology-unknown-cluster-type']}`
        );
        expect(node).to.have.text('Unknown');
      });
    });

    context('when the set has more than 1 node', function () {
      const servers = [
        { address: '127.0.0.1:27017', type: RS_PRIMARY },
        { address: '127.0.0.1:27018', type: RS_SECONDARY },
      ];
      const component = shallow(
        <Unknown servers={servers} isDataLake={false} />
      );

      it('renders the node count', function () {
        const node = component.find(
          `.${styles['topology-unknown-cluster-nodes']}`
        );
        expect(node).to.have.text('2 Servers');
      });

      it('renders the unknown text', function () {
        const node = component.find(
          `.${styles['topology-unknown-cluster-type']}`
        );
        expect(node).to.have.text('Unknown');
      });
    });

    context('connected to DataLake', function () {
      const servers = [{ address: '127.0.0.1:27017', type: RS_PRIMARY }];
      const component = shallow(<Unknown servers={servers} isDataLake />);

      it('renders the unknown text', function () {
        const node = component.find(
          `.${styles['topology-unknown-cluster-type']}`
        );
        expect(node).to.be.not.present();
      });
    });
  });
});
