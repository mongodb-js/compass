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
      const connection = {
        replica_set_name: 'myrs',
        ssh_tunnel: 'NONE'
      };
      const component = mount(
        <ReplicaSetNameInput currentConnection={connection} />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is undefined', () => {
      const connection = {
        replica_set_name: 'myrs'
      };
      const component = mount(
        <ReplicaSetNameInput currentConnection={connection} />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is null', () => {
      const connection = {
        replica_set_name: 'myrs',
        ssh_tunnel: null
      };
      const component = mount(
        <ReplicaSetNameInput currentConnection={connection} />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.have.value('myrs');
      });
    });

    context('when the ssh tunnel is USER_PASSWORD', () => {
      const connection = {
        replica_set_name: 'myrs',
        ssh_tunnel: 'USER_PASSWORD'
      };
      const component = mount(
        <ReplicaSetNameInput currentConnection={connection} />
      );

      it('renders the replica set name', () => {
        expect(component.find('input[name="replica_set_name"]')).to.not.be.present();
      });
    });
  });
});
