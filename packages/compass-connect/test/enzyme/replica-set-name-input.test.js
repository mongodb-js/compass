const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const ReplicaSetNameInput = require('../../lib/components/form/replica-set-name-input');

chai.use(chaiEnzyme());

describe('<ReplicaSetNameInput />', () => {
  describe('#render', () => {
    context('when the ssh tunnel is NONE', () => {
      const component = mount(
        <ReplicaSetNameInput replicaSetName="myrs" sshTunnel="NONE" />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is undefined', () => {
      const component = mount(
        <ReplicaSetNameInput replicaSetName="myrs" />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is null', () => {
      const component = mount(
        <ReplicaSetNameInput replicaSetName="myrs" sshTunnel={null} />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is USER_PASSWORD', () => {
      const component = mount(
        <ReplicaSetNameInput replicaSetName="myrs" sshTunnel="USER_PASSWORD" />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.not.be.present();
      });
    });
  });
});
