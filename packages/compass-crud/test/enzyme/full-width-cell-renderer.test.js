const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const { getNode, getApi, getActions, getContext, notCalledExcept,
        getDataService } = require('../aggrid-helper');
const FullWidthCellRenderer = require('../../src/components/table-view/full-width-cell-renderer');
const AppRegistry = require('hadron-app-registry');
const app = require('hadron-app');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const ObjectId = require('bson').ObjectId;

chai.use(chaiEnzyme());

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('<FullWidthCellRenderer />', () => {
  const dataService = new DataService(CONNECTION);
  before(() => {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();

    global.hadronApp.instance = {
      build: {
        version: '3.4.0'
      }
    };
  });

  after(() => {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', () => {
    let component;
    let rowNode;
    let data;
    const api = getApi();
    const actions = getActions();
    const context = getContext([]);
    describe('editing mode', () => {
      describe('unmodified', () => {
        before((done) => {
          rowNode = getNode({field1: {'subfield1': 'value'}});
          rowNode.data.state = 'editing';
          data = rowNode.data;
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                   actions={actions} data={data}
                                                   context={context}
                                                   dataService={dataService}/>);
          expect(component).to.be.present();
          done();
        });
        it('renders footer as editing', () => {
          expect(component.find('.document-footer-is-viewing')).to.be.present();
        });
        it('renders the cancel button', () => {
          expect(component.find({
            'data-test-id': 'cancel-document-button'
          })).to.be.present();
        });
        it('renders the update button', () => {
          expect(component.find({
            'data-test-id': 'update-document-button'
          })).to.be.present();
        });
      });
      describe('modified', () => {
        before((done) => {
          rowNode = getNode({});
          rowNode.data.hadronDocument.insertEnd('field1', 'value');
          rowNode.data.state = 'editing';
          data = rowNode.data;
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                   actions={actions} data={data}
                                                   context={context}
                                                   dataService={dataService}/>);
          expect(component).to.be.present();
          done();
        });
        it('renders footer as editing', () => {
          expect(component.find('.document-footer-is-modified')).to.be.present();
        });
        it('renders the cancel button', () => {
          expect(component.find({
            'data-test-id': 'cancel-document-button'
          })).to.be.present();
        });
        it('renders the update button', () => {
          expect(component.find({
            'data-test-id': 'update-document-button'
          })).to.be.present();
        });
      });
    });
    describe('deleting mode', () => {
      before((done) => {
        rowNode = getNode({field1: {'subfield1': 'value'}});
        rowNode.data.state = 'deleting';
        data = rowNode.data;
        component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                 actions={actions} data={data}
                                                 context={context}/>);
        expect(component).to.be.present();
        done();
      });
      it('renders footer as editing', () => {
        expect(component.find('.document-footer-is-error')).to.be.present();
      });
      it('renders the cancel button', () => {
        expect(component.find({
          'data-test-id': 'cancel-document-button'
        })).to.be.present();
      });
      it('renders the update button', () => {
        expect(component.find({
          'data-test-id': 'confirm-delete-document-button'
        })).to.be.present();
      });
    });
  });

  describe('#actions', () => {
    let component;
    let rowNode;
    let data;
    describe('cancel', () => {
      describe('update', () => {
        describe('with valid element', () => {
          const api = getApi();
          const actions = getActions();
          const context = getContext([]);
          before((done) => {
            rowNode = getNode({toAdd: 1, toTypeChange: 2});
            rowNode.data.state = 'editing';
            data = rowNode.data;

            data.hadronDocument.get('toAdd').remove();
            data.hadronDocument.insertEnd('toRemove', 3);
            data.hadronDocument.get('toTypeChange').edit('2');

            component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                   actions={actions} data={data}
                                                   context={context}
                                                   dataService={dataService}/>);
            const wrapper = component.find({'data-test-id': 'cancel-document-button'});
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls api.stopEditing()', () => {
            expect(api.stopEditing.callCount).to.equal(1);
          });
          it('calls replaceDoc', () => {
            expect(actions.replaceDoc.callCount).to.equal(1);
            expect(actions.replaceDoc.alwaysCalledWithExactly(
            '1', '1', {toAdd: 1, toTypeChange: 2, _id: '1'})).to.equal(true);
          });
          it('calls cleanCols', () => {
            expect(actions.cleanCols.callCount).to.equal(1);
          });
          it('does not call other actions', () => {
            notCalledExcept(actions,
              ['replaceDoc', 'cleanCols']);
          });
          it('calls cancel on the HadronDocument', () => {
            expect(data.hadronDocument.generateObject()).to.deep.equal({
              _id: '1', toAdd: 1, toTypeChange: 2
            });
          });
          it('removes the footer', () => {
            expect(context.removeFooter.callCount).to.equal(1);
            expect(context.removeFooter.alwaysCalledWithExactly(
              rowNode)).to.equal(true);
            notCalledExcept(context, ['removeFooter']);
          });
        });
        describe('with uneditable row', () => {
          const api = getApi();
          const actions = getActions();
          const context = getContext(['field does not exist']);
          before((done) => {
            rowNode = getNode({toAdd: 1, toTypeChange: 2});
            rowNode.data.state = 'editing';
            data = rowNode.data;

            data.hadronDocument.get('toAdd').remove();
            data.hadronDocument.insertEnd('toRemove', 3);
            data.hadronDocument.get('toTypeChange').edit('2');

            component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                     actions={actions} data={data}
                                                     context={context}
                                                     dataService={dataService}/>);
            const wrapper = component.find({'data-test-id': 'cancel-document-button'});
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls api.stopEditing()', () => {
            expect(api.stopEditing.callCount).to.equal(1);
          });
          it('does not call replaceDoc', () => {
            expect(actions.replaceDoc.callCount).to.equal(0);
          });
          it('does not call cleanCols', () => {
            expect(actions.cleanCols.callCount).to.equal(0);
          });
          it('does not call other actions', () => {
            notCalledExcept(actions, []);
          });
          it('calls cancel on the HadronDocument', () => {
            expect(data.hadronDocument.generateObject()).to.deep.equal({
              _id: '1', toAdd: 1, toTypeChange: 2
            });
          });
          it('removes the footer', () => {
            expect(context.removeFooter.callCount).to.equal(1);
            expect(context.removeFooter.alwaysCalledWithExactly(
              rowNode)).to.equal(true);
            notCalledExcept(context, ['removeFooter']);
          });
        });
      });
      describe('clone', () => {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        before((done) => {
          rowNode = getNode({field1: 'value'});
          rowNode.data.state = 'cloned';
          data = rowNode.data;
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                     actions={actions}
                                                     data={data}
                                                     context={context}
                                                     dataService={dataService}/>);
          const wrapper = component.find({
            'data-test-id': 'cancel-document-button'
          });
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
          done();
        });
        it('removes the footer and the row', () => {
          expect(context.handleRemove.callCount).to.equal(1);
          expect(context.handleRemove.alwaysCalledWithExactly(
              rowNode)).to.equal(true);
          notCalledExcept(context, ['handleRemove']);
        });
        it('calls api.stopEditing()', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
      });
      describe('delete', () => {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        before((done) => {
          rowNode = getNode({field1: 'value'});
          rowNode.data.state = 'deleting';
          data = rowNode.data;
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                     actions={actions}
                                                     data={data}
                                                     context={context}
                                                     dataService={dataService}/>);
          const wrapper = component.find({
            'data-test-id': 'cancel-document-button'
          });
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
          done();
        });
        it('calls api.stopEditing()', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('removes the footer', () => {
          expect(context.removeFooter.callCount).to.equal(1);
          expect(context.removeFooter.alwaysCalledWithExactly(
              rowNode)).to.equal(true);
          notCalledExcept(context, ['removeFooter']);
        });
      });
    });
    describe('confirm', () => {
      describe('update', () => {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        let ds;
        before((done) => {
          ds = getDataService(done);
          rowNode = getNode({toRemove: 1}, oid);
          rowNode.data.state = 'editing';
          data = rowNode.data;
          data.hadronDocument.insertEnd('newfield', 'value');
          data.hadronDocument.get('toRemove').remove();
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                     actions={actions}
                                                     data={data}
                                                     context={context}
                                                     dataService={ds}/>);
          expect(component.find('.document-footer-is-modified')).to.be.present();
          const wrapper = component.find({
            'data-test-id': 'update-document-button'
          });
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
        });
        it('calls api.stopEditing()', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('calls findOneAndReplace on DataService', () => {
          expect(ds.foarSpy.callCount).to.equal(1);
          expect(ds.foarSpy.alwaysCalledWith(
              {_id: oid},
              {_id: oid, newfield: 'value'})).to.equal(true);
        });
        it('calls replaceDoc', () => {
          expect(actions.replaceDoc.callCount).to.equal(1);
          expect(actions.replaceDoc.alwaysCalledWithExactly(
              '' + oid, '' + oid, {_id: oid, newfield: 'value'})).to.equal(true);
          notCalledExcept(actions, ['replaceDoc']);
        });
        it('calls context.handleUpdate', () => {
          expect(context.handleUpdate.callCount).to.equal(1);
          expect(context.handleUpdate.alwaysCalledWithExactly({
            _id: oid, newfield: 'value'
          })).to.equal(true);
          notCalledExcept(context, ['handleUpdate']);
        });
      });

      describe('clone', () => {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        let ds;
        before((done) => {
          ds = getDataService(done);
          rowNode = getNode({field: 'value'}, oid);
          rowNode.data.state = 'cloned';
          data = rowNode.data;
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                     actions={actions}
                                                     data={data}
                                                     context={context}
                                                     dataService={ds}/>);
          expect(component.find('.document-footer-is-modified')).to.be.present();
          const wrapper = component.find({
            'data-test-id': 'update-document-button'
          });
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
        });
        it('calls api.stopEditing()', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('calls insertOne on DataService', () => {
          expect(ds.iSpy.callCount).to.equal(1);
          expect(ds.iSpy.alwaysCalledWith(
              {_id: oid, field: 'value'})).to.equal(true);
        });
        it('calls context.handleUpdate', () => {
          expect(context.handleUpdate.callCount).to.equal(1);
          expect(context.handleUpdate.alwaysCalledWithExactly({
            _id: oid, field: 'value'
          })).to.equal(true);
          notCalledExcept(context, ['handleUpdate']);
        });
        it('calls replaceDoc', () => {
          expect(actions.replaceDoc.callCount).to.equal(1);
        });
        it('does not call any actions', () => {
          notCalledExcept(actions, ['replaceDoc']);
        });
      });

      describe('delete', () => {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        let ds;
        before((done) => {
          ds = getDataService(done);
          rowNode = getNode({field: 'value'}, oid);
          rowNode.data.state = 'deleting';
          data = rowNode.data;
          component = mount(<FullWidthCellRenderer api={api} node={rowNode}
                                                     actions={actions}
                                                     data={data}
                                                     context={context}
                                                     dataService={ds}/>);
          expect(component.find('.document-footer-is-error')).to.be.present();
          const wrapper = component.find({
            'data-test-id': 'confirm-delete-document-button'
          });
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
        });
        it('calls api.stopEditing()', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('calls deleteOne on DataService', () => {
          expect(ds.dSpy.callCount).to.equal(1);
          expect(ds.dSpy.alwaysCalledWith({_id: oid})).to.equal(true);
        });
        it('calls context.handleRemove', () => {
          expect(context.handleRemove.callCount).to.equal(1);
          expect(context.handleRemove.alwaysCalledWithExactly(
              rowNode)).to.equal(true);
        });
      });
    });
  });
});
