/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const InstanceHeader = require('../../src/internal-plugins/instance-header/lib/components/instance-header');

chai.use(chaiEnzyme());

const appRegistry = app.appRegistry;

describe('<InstanceHeader />', () => {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.DatabaseDDLActionSpy = sinon.spy();
    app.appRegistry.registerAction(
      'DatabaseDDL.Actions',
      {openCreateDatabaseDialog: this.DatabaseDDLActionSpy}
    );
    app.appRegistry.emit('data-service-connected', null, {
      isWritable: () => {
        return true;
      }
    });
  });
  afterEach(() => {
    app.appRegistry = appRegistry;
  });

  context('when rendering with no SSH Tunnel', () => {
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
        <InstanceHeader name="testing" activeNamespace={''}
          versionNumber={this.instance.build.version} versionDistro="Enterprise"/>
      );
    });

    it('renders the endpoint host name and port as text', function() {
      const element = this.component.find('.instance-header-details');
      expect(element.text()).to.be.equal('testing');
    });
  });

  context('when rendering with an SSH Tunnel', () => {
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
        <InstanceHeader
          name="testing"
          activeNamespace={''}
          versionNumber={this.instance.build.version} versionDistro="Community"/>
      );
    });

    it('renders the endpoint host name and port as text', function() {
      const element = this.component.find('.instance-header-details');
      expect(element.text()).to.be.equal('testing');
    });
  });
});
