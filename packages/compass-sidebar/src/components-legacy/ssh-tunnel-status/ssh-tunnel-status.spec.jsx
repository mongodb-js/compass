import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SshTunnelStatus from '../ssh-tunnel-status';
import styles from './ssh-tunnel-status.module.less';

describe('SshTunnelStatus [Component]', function () {
  context('when ssh tunnel does not exist', function () {
    let component;

    beforeEach(function () {
      component = mount(<SshTunnelStatus />);
    });

    afterEach(function () {
      component = null;
    });

    it('does not render', function () {
      expect(
        component.find(`.${styles['ssh-tunnel-status']}`)
      ).to.not.be.present();
    });
  });

  context('when ssh tunnel exists', function () {
    let component;

    beforeEach(function () {
      component = mount(
        <SshTunnelStatus
          sshTunnel
          sshTunnelHostPortString="123.45.67.88:27030"
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the root component', function () {
      expect(component.find(`.${styles['ssh-tunnel-status']}`)).to.be.present();
    });

    it('renders the label test', function () {
      expect(
        component.find(`.${styles['ssh-tunnel-status-label']}`)
      ).to.have.text('SSH connection via');
    });

    it('renders the host/port string', function () {
      expect(
        component.find(`.${styles['ssh-tunnel-status-string']}`)
      ).to.have.text('123.45.67.88:27030');
    });
  });
});
