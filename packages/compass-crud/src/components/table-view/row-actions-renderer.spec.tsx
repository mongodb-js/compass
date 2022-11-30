import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  getNode,
  getApi,
  getContext,
  notCalledExcept,
} from '../../../test/aggrid-helper';
import RowActionsRenderer from './row-actions-renderer';

describe('<RowActionsRenderer />', function () {
  const api = getApi();
  let component;
  let rowNode;
  let value;
  let context;
  let data;

  describe('#render', function () {
    describe('top-level', function () {
      before(function (done) {
        rowNode = getNode({ field1: 'value' });
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
          <RowActionsRenderer
            api={api}
            value={value}
            node={rowNode}
            context={context}
            data={data}
            nested={false}
            copyToClipboard={sinon.spy()}
            isEditable
          />
        );
        done();
      });
      it('renders the edit button', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({ title: 'Edit Document' })).to.be.present();
      });
      it('renders the copy to JSON button', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({ title: 'Copy Document' })).to.be.present();
      });
      it('renders the clone document button', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({ title: 'Clone Document' })).to.be.present();
      });
      it('renders the delete document button', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({ title: 'Delete Document' })).to.be.present();
      });
    });
    describe('nested', function () {
      before(function (done) {
        rowNode = getNode({ field1: 'value' });
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
          <RowActionsRenderer
            api={api}
            value={value}
            node={rowNode}
            context={context}
            data={data}
            nested={true}
            copyToClipboard={sinon.spy()}
            isEditable
          />
        );
        done();
      });
      it('renders the edit button', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({ title: 'Edit Document' })).to.be.present();
      });
      it('does not render other buttons', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({ title: 'Copy row' })).not.to.be.present();
        expect(wrapper.find({ title: 'Clone row' })).not.to.be.present();
        expect(wrapper.find({ title: 'Delete row' })).not.to.be.present();
      });
    });

    describe('when the distribution is readonly', function () {
      before(function () {
        rowNode = getNode({ field1: 'value' });
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
          <RowActionsRenderer
            api={api}
            value={value}
            node={rowNode}
            context={context}
            data={data}
            nested={true}
            copyToClipboard={sinon.spy()}
            isEditable={false}
          />
        );
      });

      it('does not render the buttons', function () {
        const wrapper = component.find('.table-view-row-actions');
        expect(
          wrapper.find('button[title="Edit Document"]')
        ).not.to.be.present();
        expect(wrapper.find('button[title="Copy row"]')).not.to.be.present();
        expect(wrapper.find('button[title="Clone row"]')).not.to.be.present();
        expect(wrapper.find('button[title="Delete row"]')).not.to.be.present();
      });
    });
  });

  describe('#actions', function () {
    describe('top-level', function () {
      describe('click the edit button', function () {
        before(function (done) {
          rowNode = getNode({ field1: 'value' });
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(
            <RowActionsRenderer
              api={api}
              value={value}
              node={rowNode}
              context={context}
              data={data}
              nested={false}
              copyToClipboard={sinon.spy()}
              isEditable
            />
          );
          const wrapper = component.find('button[title="Edit Document"]');
          wrapper.simulate('click');
          done();
        });
        it('calls context.addFooter with editing', function () {
          expect(context.addFooter.callCount).to.equal(1);
          expect(
            context.addFooter.alwaysCalledWithExactly(
              rowNode,
              rowNode.data,
              'editing'
            )
          ).to.equal(true);
        });
        it('does not call anything else on context', function () {
          notCalledExcept(context, ['addFooter']);
        });
      });
      describe('click the clone document button', function () {
        before(function (done) {
          rowNode = getNode({ field1: 'value' });
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(
            <RowActionsRenderer
              api={api}
              value={value}
              node={rowNode}
              context={context}
              data={data}
              nested={false}
              copyToClipboard={sinon.spy()}
              isEditable
            />
          );
          const wrapper = component.find('button[title="Clone Document"]');
          wrapper.simulate('click');
          done();
        });
        it('calls context.handleClone', function () {
          expect(context.handleClone.callCount).to.equal(1);
          expect(context.handleClone.alwaysCalledWithExactly(data)).to.equal(
            true
          );
        });
        it('does not call anything else on context', function () {
          notCalledExcept(context, ['handleClone']);
        });
      });
      describe('click the delete document button', function () {
        before(function (done) {
          rowNode = getNode({ field1: 'value' });
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(
            <RowActionsRenderer
              api={api}
              value={value}
              node={rowNode}
              context={context}
              data={data}
              nested={false}
              copyToClipboard={sinon.spy()}
              isEditable
            />
          );
          const wrapper = component.find('button[title="Delete Document"]');
          wrapper.simulate('click');
          done();
        });
        it('calls context.addFooter with deleting', function () {
          expect(context.addFooter.callCount).to.equal(1);
          expect(
            context.addFooter.alwaysCalledWithExactly(
              rowNode,
              rowNode.data,
              'deleting'
            )
          ).to.equal(true);
        });
        it('does not call anything else on context', function () {
          notCalledExcept(context, ['addFooter']);
        });
      });
    });

    describe('nested', function () {
      describe('click edit', function () {
        before(function (done) {
          rowNode = getNode({ field1: 'value' });
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(
            <RowActionsRenderer
              api={api}
              value={value}
              node={rowNode}
              context={context}
              data={data}
              nested={true}
              copyToClipboard={sinon.spy()}
              isEditable
            />
          );
          const wrapper = component.find('button');
          wrapper.simulate('click');
          done();
        });
        it('calls context.addFooter with editing', function () {
          expect(context.addFooter.callCount).to.equal(1);
          expect(
            context.addFooter.alwaysCalledWithExactly(
              rowNode,
              rowNode.data,
              'editing'
            )
          ).to.equal(true);
        });
        it('does not call anything else on context', function () {
          notCalledExcept(context, ['addFooter']);
        });
      });
    });
  });
});
