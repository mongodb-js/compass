const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const ReplicaSetInput = require('../../lib/components/form/replica-set-input');

chai.use(chaiEnzyme());

describe('<ReplicaSetInput />', () => {
  describe('#render', () => {
    context('when the ssh tunnel is NONE', () => {
      const component = mount(
        <ReplicaSetInput replicaSet="myrs" sshTunnel="NONE" />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replicaSet"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is undefined', () => {
      const component = mount(
        <ReplicaSetInput replicaSet="myrs" />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replicaSet"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is null', () => {
      const component = mount(
        <ReplicaSetInput replicaSet="myrs" sshTunnel={null} />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replicaSet"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is USER_PASSWORD', () => {
      const component = mount(
        <ReplicaSetInput replicaSet="myrs" sshTunnel="USER_PASSWORD" />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replicaSet"]')).to.not.be.present();
      });
    });
  });
});
