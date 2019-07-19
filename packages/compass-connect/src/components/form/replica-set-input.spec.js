import React from 'react';
import { mount } from 'enzyme';
import ReplicaSetInput from './replica-set-input';

describe('ReplicaSetInput [Component]', () => {
  context('when the ssh tunnel is NONE', () => {
    let component;

    beforeEach(() => {
      component = mount(<ReplicaSetInput replicaSet="myrs" sshTunnel="NONE" />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the replica set name', () => {
      expect(component.find('input[name="replicaSet"]')).to.have.value('myrs');
    });
  });

  context('when the ssh tunnel is undefined', () => {
    let component;

    beforeEach(() => {
      component = mount(<ReplicaSetInput replicaSet="myrs" />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the replica set name', () => {
      expect(component.find('input[name="replicaSet"]')).to.have.value('myrs');
    });
  });

  context('when the ssh tunnel is null', () => {
    let component;

    beforeEach(() => {
      component = mount(<ReplicaSetInput replicaSet="myrs" sshTunnel={null} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the replica set name', () => {
      expect(component.find('input[name="replicaSet"]')).to.have.value('myrs');
    });
  });

  context('when the ssh tunnel is USER_PASSWORD', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <ReplicaSetInput replicaSet="myrs" sshTunnel="USER_PASSWORD" />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the replica set name', () => {
      expect(component.find('input[name="replicaSet"]')).to.not.be.present();
    });
  });
});
