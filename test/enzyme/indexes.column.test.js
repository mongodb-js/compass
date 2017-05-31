/* eslint no-unused-expressions: 0 */
/* eslint no-unused-vars: 0 */
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const {mount, shallow} = require('enzyme');

const SizeColumn = require('../../src/internal-packages/indexes/lib/component/size-column');
const UsageColumn = require('../../src/internal-packages/indexes/lib/component/usage-column');

chai.use(chaiEnzyme());

require('../../src/app/reflux-listen-to-external-store.js');

describe('<Indexes />', () => {
  let component;

  const sizeTemplate = {
    size: 5200,
    relativeSize: 23
  };

  const usageTemplate = {
    usage: 12,
    usageSince: 'Tuesday Nov 29 2016'
  };

  let appRegistry = app.appRegistry;
  let appInstance = app.instance;
  beforeEach(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    app.instance = {build: {version: '3.2.0'}};

    this.CreateIndexButton = require('../../src/internal-packages/indexes/lib/component/create-index-button');
  });
  afterEach(function() {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.instance = appInstance;
  });

  context('When collection is not writable', function() {
    it('disables the CREATE INDEX button', function() {
      component = shallow(<this.CreateIndexButton isWritable={false} description="not writable" />);
      expect(component.find('.btn.btn-primary.btn-xs')).to.be.disabled();
    });

    it('shows tooltip indicating why button is disabled', () => {
      expect(component.find('.tooltip-button-wrapper'))
        .to.have.data('tip', 'not writable');
    });
  });

  context('When collection is writable', function() {
    it('enables the CREATE INDEX button', function() {
      component = shallow(<this.CreateIndexButton isWritable={true} />);
      expect(component.find('.btn.btn-primary.btn-xs')).to.not.be.disabled();
    });
  });

  context('When indexes are loaded', function() {
    it('has a size column', function() {
      const size = Object.assign({}, sizeTemplate);
      component = mount(
        <table><tbody><tr>
          <SizeColumn {...size} />
        </tr></tbody></table>
      );
      expect(component.find('.quantity')).to.have.text('5.1');
    });
    it('has a usage column', function() {
      const usage = Object.assign({}, usageTemplate);
      component = mount(
        <table><tbody><tr>
          <UsageColumn {...usage} />
        </tr></tbody></table>
      );
      expect(component.find('.quantity')).to.have.text('12');
    });
    it('has a size tooltip', function() {
      const size = Object.assign({}, sizeTemplate);
      component = mount(
        <table><tbody><tr>
          <SizeColumn {...size} />
        </tr></tbody></table>
      );
      expect(component.find('.progress')).to.have.data('tip', '23.00% compared to largest index');
    });
    it('has a usage tooltip', function() {
      const usage = Object.assign({}, usageTemplate);
      component = mount(
        <table><tbody><tr>
          <UsageColumn {...usage} />
        </tr></tbody></table>
      );
      expect(component.find('.quantity')).to.have.data('tip',
      '12 index hits since index creation or last\n server restart');
    });
  });
});
