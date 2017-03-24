/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const SidebarCollection = require('../../src/internal-packages/sidebar/lib/components/sidebar-collection');

chai.use(chaiEnzyme());

const appDataService = app.dataService;
const appRegistry = app.appRegistry;

describe('<SidebarCollection />', () => {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.InstanceActionSpy = sinon.spy();
    app.appRegistry.registerAction(
      'Database.CollectionsActions',
      {openDropCollectionDialog: this.InstanceActionSpy}
    );
    app.dataService = {
      isWritable: () => {
        return true;
      }
    };
  });
  afterEach(() => {
    app.dataService = appDataService;
    app.appRegistry = appRegistry;
  });

  context('when dataService is not writable', function() {
    beforeEach(function() {
      app.dataService = {
        isWritable: () => {
          return false;
        }
      };
      this.component = shallow(
        <SidebarCollection
          _id="foo.bar"
          database="foo"
          activeNamespace={''}
        />);
    });
    it('drop collection contains a disabled BEM modifer class', function() {
      const element = this.component.find('.compass-sidebar-icon-drop-collection');
      expect(element.hasClass('compass-sidebar-icon-is-disabled')).to.be.true;
    });
    it('warns the drop collection icon does not work on secondaries', function() {
      const expected = 'Drop collection is not available on a secondary node';
      const element = this.component.find('.compass-sidebar-icon-drop-collection');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('the drop collection icon triggers no action', function() {
      const element = this.component.find('.compass-sidebar-icon-drop-collection');
      element.simulate('click');
      expect(this.InstanceActionSpy.called).to.be.false;
    });
  });

  context('when dataService is writable', () => {
    beforeEach(function() {
      this.component = shallow(
      <SidebarCollection
        _id="foo.bar"
        database="foo"
        activeNamespace={''}
      />);
    });
    it('renders a drop collection icon with tooltip', function() {
      const expected = 'Drop collection';
      const element = this.component.find('.compass-sidebar-icon-drop-collection');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('clicking the drop collection icon triggers an action', function() {
      const element = this.component.find('.compass-sidebar-icon-drop-collection');
      element.simulate('click');
      expect(this.InstanceActionSpy.calledOnce).to.be.true;
    });
  });
});
