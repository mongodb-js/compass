import React from 'react';
import { shallow } from 'enzyme';
import Single from './single';
import {
  STANDALONE,
  RS_PRIMARY,
  RS_SECONDARY,
  RS_ARBITER,:
  RS_OTHER,
  RS_GHOST,
  UNKNOWN,
  POSSIBLE_PRIMARY
} from '../../models/server-type';

import styles from './single.module.less';

describe('<Single />', function () {
  describe('#render', function () {
    context('when the server is standalone', function () {
      const server = { address: '127.0.0.1:27017', type: STANDALONE };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Standalone');
      });
    });

    context('when the server is a primary', function () {
      const server = { address: '127.0.0.1:27017', type: RS_PRIMARY };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Primary');
      });
    });

    context('when the server is a secondary', function () {
      const server = { address: '127.0.0.1:27017', type: RS_SECONDARY };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Secondary');
      });
    });

    context('when the server is an arbiter', function () {
      const server = { address: '127.0.0.1:27017', type: RS_ARBITER };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Arbiter');
      });
    });

    context('when the server is a ghost', function () {
      const server = { address: '127.0.0.1:27017', type: RS_GHOST };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Ghost');
      });
    });

    context('when the server is unknown', function () {
      const server = { address: '127.0.0.1:27017', type: UNKNOWN };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Unknown');
      });
    });

    context('when the server is an other', function () {
      const server = { address: '127.0.0.1:27017', type: RS_OTHER };
      const component = shallow(<Single server={server} isDataLake={false} />);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Other');
      });
    });

    context('when the server is a possible primary', function () {
      const server = { address: '127.0.0.1:27017', type: POSSIBLE_PRIMARY };
      const component = shallow(<Single server={server} isDataLake={false}/>);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.have.text('Possible Primary');
      });
    });

    context('when connected to DataLake', function () {
      const server = { address: '127.0.0.1:27017', type: STANDALONE };
      const component = shallow(<Single server={server} isDataLake/>);

      it('renders the address', function () {
        const node = component.find(`.${styles['topology-single-host-address']}`);
        expect(node).to.have.text('127.0.0.1:27017');
      });

      it('does not renders the humanized type', function () {
        const node = component.find(`.${styles['topology-single-cluster-type']}`);
        expect(node).to.be.not.present();
      });
    });
  });
});
