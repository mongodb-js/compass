import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import app from 'hadron-app';
import { ObjectId } from 'bson';
import { expect } from 'chai';

import {
  getNode,
  getApi,
  getActions,
  getContext,
  notCalledExcept,
} from '../../../test/aggrid-helper';
import FullWidthCellRenderer from './full-width-cell-renderer';

describe('<FullWidthCellRenderer />', function () {
  before(function () {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  after(function () {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', function () {
    let component;
    let rowNode;
    let data;
    const api = getApi();
    const actions = getActions();
    const context = getContext([]);

    after(function () {
      component.unmount();
      component = null;
    });

    describe('editing mode', function () {
      describe('unmodified', function () {
        before(function (done) {
          rowNode = getNode({ field1: { subfield1: 'value' } });
          rowNode.data.state = 'editing';
          data = rowNode.data;
          component = mount(
            <FullWidthCellRenderer
              api={api}
              node={rowNode}
              replaceDoc={actions.replaceDoc}
              cleanCols={actions.cleanCols}
              updateDocument={actions.updateDocument}
              removeDocument={actions.removeDocument}
              replaceDocument={actions.replaceDocument}
              data={data}
              context={context}
            />
          );
          expect(component).to.be.present();
          done();
        });
        it('renders footer as editing', function () {
          expect(
            component.find('[data-testid="document-footer"]')
          ).to.be.present();
        });
        it('renders the cancel button', function () {
          expect(
            component.find('button[data-testid="cancel-button"]')
          ).to.be.present();
        });
        it('renders the update button', function () {
          expect(
            component.find('button[data-testid="update-button"]')
          ).to.be.present();
        });
      });
      describe('modified', function () {
        before(function (done) {
          rowNode = getNode({});
          rowNode.data.hadronDocument.insertEnd('field1', 'value');
          rowNode.data.state = 'editing';
          data = rowNode.data;
          component = mount(
            <FullWidthCellRenderer
              api={api as any}
              node={rowNode}
              replaceDoc={actions.replaceDoc}
              cleanCols={actions.cleanCols}
              updateDocument={actions.updateDocument}
              removeDocument={actions.removeDocument}
              replaceDocument={actions.replaceDocument}
              data={data}
              context={context}
            />
          );
          expect(component).to.be.present();
          done();
        });
        it('renders footer as editing', function () {
          expect(
            component.find(
              '[data-testid="document-footer"][data-status="Modified"]'
            )
          ).to.be.present();
        });
        it('renders the cancel button', function () {
          expect(
            component.find('button[data-testid="cancel-button"]')
          ).to.be.present();
        });
        it('renders the update button', function () {
          expect(
            component.find('button[data-testid="update-button"]')
          ).to.be.present();
        });
      });
    });
    describe('deleting mode', function () {
      before(function (done) {
        rowNode = getNode({ field1: { subfield1: 'value' } });
        rowNode.data.state = 'deleting';
        data = rowNode.data;
        component = mount(
          <FullWidthCellRenderer
            api={api as any}
            node={rowNode}
            replaceDoc={actions.replaceDoc}
            cleanCols={actions.cleanCols}
            updateDocument={actions.updateDocument}
            removeDocument={actions.removeDocument}
            replaceDocument={actions.replaceDocument}
            data={data}
            context={context}
          />
        );
        expect(component).to.be.present();
        done();
      });
      it('renders footer as deleting', function () {
        expect(
          component.find(
            '[data-testid="document-footer"][data-status="Deleting"]'
          )
        ).to.be.present();
      });
      it('renders the cancel button', function () {
        expect(
          component.find('button[data-testid="cancel-button"]')
        ).to.be.present();
      });
      it('renders the delete button', function () {
        expect(
          component.find('button[data-testid="delete-button"]')
        ).to.be.present();
      });
    });
  });

  describe('#actions', function () {
    let component;
    let rowNode;
    let data;
    describe('cancel', function () {
      describe('update', function () {
        describe('with valid element', function () {
          const api = getApi();
          const actions = getActions();
          const context = getContext([]);
          before(function (done) {
            rowNode = getNode({ toAdd: '1', toTypeChange: '2' });
            rowNode.data.state = 'editing';
            data = rowNode.data;

            data.hadronDocument.get('toAdd').remove();
            data.hadronDocument.insertEnd('toRemove', '3');
            data.hadronDocument.get('toTypeChange').edit(false);

            component = mount(
              <FullWidthCellRenderer
                api={api as any}
                node={rowNode}
                replaceDoc={actions.replaceDoc}
                cleanCols={actions.cleanCols}
                updateDocument={actions.updateDocument}
                removeDocument={actions.removeDocument}
                replaceDocument={actions.replaceDocument}
                data={data}
                context={context}
              />
            );
            const wrapper = component.find(
              'button[data-testid="cancel-button"]'
            );
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls api.stopEditing()', function () {
            expect(api.stopEditing.callCount).to.equal(1);
          });
          it('calls replaceDoc', function () {
            expect(actions.replaceDoc.callCount).to.equal(1);
            expect(
              actions.replaceDoc.alwaysCalledWithExactly('1', '1', {
                toAdd: '1',
                toTypeChange: '2',
                _id: '1',
              })
            ).to.equal(true);
          });
          it('calls cleanCols', function () {
            expect(actions.cleanCols.callCount).to.equal(1);
          });
          it('does not call other actions', function () {
            notCalledExcept(actions, ['replaceDoc', 'cleanCols']);
          });
          it('calls cancel on the HadronDocument', function () {
            expect(data.hadronDocument.generateObject()).to.deep.equal({
              _id: '1',
              toAdd: '1',
              toTypeChange: '2',
            });
          });
          it('removes the footer', function () {
            expect(context.removeFooter.callCount).to.equal(1);
            expect(
              context.removeFooter.alwaysCalledWithExactly(rowNode)
            ).to.equal(true);
            notCalledExcept(context, ['removeFooter']);
          });
        });
        describe('with uneditable row', function () {
          const api = getApi();
          const actions = getActions();
          const context = getContext(['field does not exist']);
          before(function (done) {
            rowNode = getNode({ toAdd: '1', toTypeChange: '2' });
            rowNode.data.state = 'editing';
            data = rowNode.data;

            data.hadronDocument.get('toAdd').remove();
            data.hadronDocument.insertEnd('toRemove', 3);
            data.hadronDocument.get('toTypeChange').edit('2');

            component = mount(
              <FullWidthCellRenderer
                api={api as any}
                node={rowNode}
                replaceDoc={actions.replaceDoc}
                cleanCols={actions.cleanCols}
                updateDocument={actions.updateDocument}
                removeDocument={actions.removeDocument}
                data={data}
                context={context}
                replaceDocument={() => {}}
              />
            );
            const wrapper = component.find(
              'button[data-testid="cancel-button"]'
            );
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls api.stopEditing()', function () {
            expect(api.stopEditing.callCount).to.equal(1);
          });
          it('does not call replaceDoc', function () {
            expect(actions.replaceDoc.callCount).to.equal(0);
          });
          it('does not call cleanCols', function () {
            expect(actions.cleanCols.callCount).to.equal(0);
          });
          it('does not call other actions', function () {
            notCalledExcept(actions, []);
          });
          it('calls cancel on the HadronDocument', function () {
            expect(data.hadronDocument.generateObject()).to.deep.equal({
              _id: '1',
              toAdd: '1',
              toTypeChange: '2',
            });
          });
          it('removes the footer', function () {
            expect(context.removeFooter.callCount).to.equal(1);
            expect(
              context.removeFooter.alwaysCalledWithExactly(rowNode)
            ).to.equal(true);
            notCalledExcept(context, ['removeFooter']);
          });
        });
      });
      describe('delete', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        before(function (done) {
          rowNode = getNode({ field1: 'value' });
          rowNode.data.state = 'deleting';
          data = rowNode.data;
          component = mount(
            <FullWidthCellRenderer
              api={api as any}
              node={rowNode}
              replaceDoc={actions.replaceDoc}
              cleanCols={actions.cleanCols}
              updateDocument={actions.updateDocument}
              removeDocument={actions.removeDocument}
              replaceDocument={actions.replaceDocument}
              data={data}
              context={context}
            />
          );
          const wrapper = component.find('button[data-testid="cancel-button"]');
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
          done();
        });
        it('calls api.stopEditing()', function () {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('removes the footer', function () {
          expect(context.removeFooter.callCount).to.equal(1);
          expect(
            context.removeFooter.alwaysCalledWithExactly(rowNode)
          ).to.equal(true);
          notCalledExcept(context, ['removeFooter']);
        });
      });
    });
    describe('confirm', function () {
      describe('update', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        before(function () {
          rowNode = getNode({ toRemove: 1 }, oid);
          rowNode.data.state = 'editing';
          data = rowNode.data;
          data.hadronDocument.insertEnd('newfield', 'value');
          data.hadronDocument.get('toRemove').remove();
          component = mount(
            <FullWidthCellRenderer
              api={api as any}
              node={rowNode}
              replaceDoc={actions.replaceDoc}
              cleanCols={actions.cleanCols}
              updateDocument={actions.updateDocument}
              removeDocument={actions.removeDocument}
              replaceDocument={actions.replaceDocument}
              data={data}
              context={context}
            />
          );
          expect(
            component.find(
              '[data-testid="document-footer"][data-status="Modified"]'
            )
          ).to.be.present();
          const wrapper = component.find('button[data-testid="update-button"]');
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
        });
        it('calls api.stopEditing()', function () {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('calls updateDocument()', function () {
          expect(actions.updateDocument.callCount).to.equal(1);
        });
      });

      describe('delete', function () {
        const api = getApi();
        const actions = getActions();
        const context = getContext([]);
        const oid = new ObjectId();
        before(function () {
          rowNode = getNode({ field: 'value' }, oid);
          rowNode.data.state = 'deleting';
          data = rowNode.data;
          component = mount(
            <FullWidthCellRenderer
              api={api as any}
              node={rowNode}
              replaceDoc={actions.replaceDoc}
              cleanCols={actions.cleanCols}
              updateDocument={actions.updateDocument}
              removeDocument={actions.removeDocument}
              replaceDocument={actions.replaceDocument}
              data={data}
              context={context}
            />
          );
          expect(
            component.find(
              '[data-testid="document-footer"][data-status="Deleting"]'
            )
          ).to.be.present();
          const wrapper = component.find('button[data-testid="delete-button"]');
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
        });
        it('calls api.stopEditing()', function () {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('calls removeDocument()', function () {
          expect(actions.removeDocument.callCount).to.equal(1);
        });
      });
    });
  });
});
