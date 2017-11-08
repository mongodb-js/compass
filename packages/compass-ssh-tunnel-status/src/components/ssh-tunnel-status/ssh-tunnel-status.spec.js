import React from 'react';
import { mount } from 'enzyme';

import SshTunnelStatus from 'components/ssh-tunnel-status';
import styles from './ssh-tunnel-status.less';

describe('SshTunnelStatus [Component]', () => {
  context('when ssh tunnel does not exist', () => {
    let component;

    beforeEach(() => {
      component = mount(<SshTunnelStatus />);
    });

    afterEach(() => {
      component = null;
    });

    it('does not render', () => {
      expect(component.find(`.${styles['ssh-tunnel-status']}`)).to.not.be.present();
    });
  });

  context('when ssh tunnel exists', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <SshTunnelStatus sshTunnel sshTunnelHostPortString="123.45.67.88:27030" />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the root component', () => {
      expect(component.find(`.${styles['ssh-tunnel-status']}`)).to.be.present();
    });

    it('renders the lock', () => {
      expect(component.find('.fa-lock')).to.be.present();
    });

    it('renders the label', () => {
      expect(component.find(`.${styles['ssh-tunnel-status-label']}`)).to.be.present();
    });

    it('renders the label test', () => {
      expect(component.find(`.${styles['ssh-tunnel-status-label-is-static']}`)).to.have.
        text('SSH connection via:');
    });

    it('renders the host/port string', () => {
      expect(component.find(`.${styles['ssh-tunnel-status-string']}`)).to.have.
        text('123.45.67.88:27030');
    });
  });
});
