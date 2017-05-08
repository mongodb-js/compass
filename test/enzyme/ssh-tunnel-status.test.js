/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const SSHTunnelStatus = require('../../src/internal-packages/ssh-tunnel-status/lib/components/ssh-tunnel-status');
const Actions = require('../../src/internal-packages/ssh-tunnel-status/lib/actions');
chai.use(chaiEnzyme());

const appRegistry = app.appRegistry;
const dataService = app.dataService;

describe('<SSHTunnelStatus />', () => {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.DatabaseDDLActionSpy = sinon.spy();
    app.appRegistry.registerAction(
      'DatabaseDDL.Actions',
      {openCreateDatabaseDialog: this.DatabaseDDLActionSpy}
    );
    app.dataService = {
      isWritable: () => {
        return true;
      }
    };
  });
  afterEach(() => {
    app.dataService = dataService;
    app.appRegistry = appRegistry;
  });

  context('when connecting without SSH Tunnel', () => {
    beforeEach(function() {
      app.connection = {
        ssh_tunnel_hostname: 'ip-1-2-3-4-5-6-7-mongodb.com',
        ssh_tunnel_options: {
          dstPort: 27000
        },
        ssh_tunnel: 'NONE'
      };
      this.instance = {
        build: {version: '3.4.0-rc2'},
        collections: [],
        databases: []
      };
      this.component = shallow(
        <SSHTunnelStatus actions={Actions} sshTunnel={false} sshTunnelHostPortString=""/>
      );
    });

    it('does not render the ssh-tunnel-status component', function() {
      const element = this.component.find('.ssh-tunnel-status');
      expect(element).to.not.be.present();
    });
  });

  context('when connecting with an SSH Tunnel', () => {
    beforeEach(function() {
      app.connection = {
        hostname: 'ip-1-2-3-4-5-6-7-secret-mongod.com',
        port: 27017,
        ssh_tunnel: 'IDENTITY_FILE',
        ssh_tunnel_hostname: 'my-jump-box.com',
        ssh_tunnel_options: {
          dstPort: 2222
        }
      };
      this.instance = {
        build: {version: '3.2.10'},
        collections: [],
        databases: []
      };
      this.component = shallow(
        <SSHTunnelStatus actions={Actions} sshTunnel={true} sshTunnelHostPortString="my-jump-box.com:2222"/>
      );
    });

    it('renders the bastion host name and port as text', function() {
      const element = this.component.find('.ssh-tunnel-status-hostportstring');
      expect(element.text()).to.be.equal('my-jump-box.com:2222');
    });

    it('renders the static label before the host port string', function() {
      const element = this.component.find('.ssh-tunnel-status-label-is-static');
      expect(element.text().trim()).to.be.equal('SSH connection via');
    });
  });
});
