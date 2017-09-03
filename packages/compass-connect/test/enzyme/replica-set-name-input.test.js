const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const ReplicaSetNameInput = require('../../src/components/form/replica-set-name-input');

chai.use(chaiEnzyme());

describe('<ReplicaSetNameInput />', () => {
  describe('#render', () => {
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
});
