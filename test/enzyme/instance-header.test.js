/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const InstanceHeader = require('../../src/internal-packages/instance-header/lib/components/instance-header');

chai.use(chaiEnzyme());

const appRegistry = app.appRegistry;
const dataService = app.dataService;

describe('<InstanceHeader />', () => {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.InstanceActionSpy = sinon.spy();
    app.appRegistry.registerAction(
      'Instance.Actions',
      {openCreateDatabaseDialog: this.InstanceActionSpy}
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

  context('when rendering with no SSH Tunnel', () => {
    beforeEach(function() {
      app.connection = {
        ssh_tunnel_hostname: 'ip-1-2-3-4-mongod.com',
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
        <InstanceHeader hostname="localhost" port={27017} activeNamespace={''}
          versionNumber={this.instance.build.version} versionDistro="Enterprise"/>
      );
    });

    it('renders the endpoint host name and port as text', function() {
      const element = this.component.find('.instance-header-details');
      expect(element.text()).to.be.equal('localhost:27017');
    });
    it('renders instance build version', function() {
      const distro = this.component.find('.instance-header-version-distro');
      const number = this.component.find('.instance-header-version-number');
      expect(distro.text()).to.be.equal(' Enterprise');
      expect(number.text()).to.be.equal(`MongoDB ${this.instance.build.version}`);
    });
  });

  context('when rendering with an SSH Tunnel', () => {
    beforeEach(function() {
      app.connection = {
        hostname: 'ip-1-2-3-4-secret-mongod.com',
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
        <InstanceHeader hostname={app.connection.hostname}
          port={app.connection.port} activeNamespace={''}
          versionNumber={this.instance.build.version} versionDistro="Community"/>
      );
    });

    it('renders the endpoint host name and port as text', function() {
      const element = this.component.find('.instance-header-details');
      expect(element.text()).to.be.equal('ip-1-2-3-...ongod.com:27017');
    });
    it('renders instance build version', function() {
      const distro = this.component.find('.instance-header-version-distro');
      const number = this.component.find('.instance-header-version-number');
      expect(distro.text()).to.be.equal(' Community');
      expect(number.text()).to.be.equal(`MongoDB ${this.instance.build.version}`);
    });
    it('renders the ssh host name and port as text', function() {
      const element = this.component.find('.instance-header-ssh-label');
      expect(element.text()).to.be.equal(' SSH connection via  my-jump-box.com:2222');
    });
  });
});
