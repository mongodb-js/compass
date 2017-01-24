/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');

const shallow = require('enzyme').shallow;
const SidebarInstanceProperties = require('../../src/internal-packages/sidebar/lib/components/sidebar-instance-properties');

chai.use(chaiEnzyme());

describe('<SidebarInstanceProperties />', () => {
  context('when rendering with no SSH Tunnel', () => {
    beforeEach(function() {
      const connection = {
        hostname: 'ip-1-2-3-4-mongod.com',
        port: 27000,
        ssh_tunnel: 'NONE'
      };
      const instance = {
        build: {
          enterprise_module: true,
          version: '3.4.0-rc3'
        },
        collections: [],
        databases: []
      };
      this.component = shallow(
      <SidebarInstanceProperties
        connection={connection}
        instance={instance}
        activeNamespace={''}
      />);
    });
    it('renders the endpoint host name and port as text', function() {
      const element = this.component.find('.compass-sidebar-instance-hostname');
      expect(element.text()).to.be.equal('ip-1-2-3-4-mongod.com:27000');
    });
    it('does not render any ssh-tunnel section', function() {
      const element = this.component.find('.compass-sidebar-instance-ssh-tunnel');
      expect(element).to.not.exist;
    });
    it('renders instance build version', function() {
      const element = this.component.find('.compass-sidebar-instance-version');
      expect(element.text()).to.be.equal('Enterprise version 3.4.0-rc3');
    });
  });

  context('when rendering with an SSH Tunnel', () => {
    beforeEach(function() {
      const connection = {
        hostname: 'ip-1-2-3-4-secret-mongod.com',
        port: 27017,
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_options: {
          host: 'my-jump-box.com',
          port: '2222'
        }
      };
      const instance = {
        build: {version: '3.2.10'},
        collections: [],
        databases: []
      };
      this.component = shallow(
        <SidebarInstanceProperties
          connection={connection}
          instance={instance}
          activeNamespace={''}
        />);
    });
    it('renders the endpoint host name and port as text', function() {
      const element = this.component.find('.compass-sidebar-instance-hostname');
      expect(element.text()).to.be.equal('ip-1-2-3-4-secret-mongod.com:27017');
    });
    it('renders the SSH tunnel host name and port text', function() {
      const element = this.component.find('.compass-sidebar-instance-ssh-tunnel');
      expect(element.text()).to.be.equal('via SSH tunnel my-jump-box.com:2222');
    });
    it('renders instance build version', function() {
      const element = this.component.find('.compass-sidebar-instance-version');
      expect(element.text()).to.be.equal('Community version 3.2.10');
    });
  });
});
