const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const {getActions, notCalledExcept} = require('../aggrid-helper');
const BreadcrumbComponent = require('../../src/components/breadcrumb');

chai.use(chaiEnzyme());

describe('<BreadcrumbComponent />', () => {
  describe('#render', () => {
    const actions = getActions();
    let component;
    let tabs;

    describe('empty path', () => {
      before((done) => {
        component = mount(<BreadcrumbComponent collection={''}
                                               actions={actions}/>);
        component.instance().breadcrumbStoreChanged({
          path: [],
          types: [],
          collection: 'compass-crud'
        });
        done();
      });
      it('renders the breadcrumb container', () => {
        const wrapper = component.find('.ag-header-breadcrumb-container');
        expect(wrapper).to.be.present();
      });
      it('renders one tab with the collection name and home icon', () => {
        tabs = component.find('.ag-header-breadcrumb-tab');
        expect(tabs).to.have.length(1);
        expect(tabs.text()).to.equal('compass-crud');
        expect(tabs.find('.ag-header-breadcrumb-home-icon')).to.be.present();
      });
    });

    describe('large path', () => {
      before((done) => {
        component = mount(<BreadcrumbComponent collection={''}
                                               actions={actions}/>);
        component.instance().breadcrumbStoreChanged({
          path: ['a', 'b', 1],
          types: ['Object', 'Array', 'Object'],
          collection: 'compass-crud'
        });
        tabs = component.find('.ag-header-breadcrumb-tab');
        expect(tabs).to.be.present();
        done();
      });
      it('renders the first tab with the collection name and home icon', () => {
        const tab = tabs.at(0);
        expect(tab.text()).to.equal('compass-crud');
        expect(tab.find('.ag-header-breadcrumb-home-icon')).to.be.present();
      });
      it('renders 2nd tab with the correct name and type', () => {
        const tab = tabs.at(1);
        expect(tab.text()).to.equal('a { }');
      });
      it('renders 3rd tab with the correct name and type', () => {
        const tab = tabs.at(2);
        expect(tab.text()).to.equal('b [ ]');
      });
      it('renders 4th tab with the correct name and type', () => {
        const tab = tabs.at(3);
        expect(tab.text()).to.equal('b.1 { }');
        expect(tab.is('.ag-header-breadcrumb-tab-active')).to.equal(true);
      });
    });
  });

  describe('#actions', () => {
    let component;
    let tabs;
    let actions;
    describe('clicking on the home button triggers correctly', () => {
      before((done) => {
        actions = getActions();
        component = mount(<BreadcrumbComponent collection={''}
                                               actions={actions}/>);
        component.instance().breadcrumbStoreChanged({
          path: ['a', 'b', 1],
          types: ['Object', 'Array', 'Object'],
          collection: 'compass-crud'
        });
        tabs = component.find('.ag-header-breadcrumb-tab');
        expect(tabs).to.be.present();
        tabs.at(0).simulate('click');
        done();
      });
      it('triggers the pathChanged action', () => {
        expect(actions.pathChanged.callCount).to.equal(1);
        expect(actions.pathChanged.alwaysCalledWithExactly([], []));
        notCalledExcept(actions, 'pathChanged');
      });
    });

    describe('clicking on a tab triggers correctly', () => {
      before((done) => {
        actions = getActions();
        component = mount(<BreadcrumbComponent collection={''}
                                               actions={actions}/>);
        component.instance().breadcrumbStoreChanged({
          path: ['a', 'b', 1],
          types: ['Object', 'Array', 'Object'],
          collection: 'compass-crud'
        });
        tabs = component.find('.ag-header-breadcrumb-tab');
        expect(tabs).to.be.present();
        expect(tabs.at(1).text()).to.equal('a { }');
        tabs.at(1).simulate('click');
        done();
      });
      it('triggers the pathChanged action', () => {
        expect(actions.pathChanged.callCount).to.equal(1);
        expect(actions.pathChanged.alwaysCalledWithExactly(['a'], ['Object']));
        notCalledExcept(actions, 'pathChanged');
      });
    });
  });
});
