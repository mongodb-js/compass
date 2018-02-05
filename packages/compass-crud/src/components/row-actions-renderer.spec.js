/* eslint react/jsx-boolean-value:0 */
import React from 'react';
import { mount } from 'enzyme';
import { getNode, getApi, getContext, notCalledExcept } from '../../test/aggrid-helper';
import RowActionsRenderer from 'components/table-view/row-actions-renderer';

describe('<RowActionsRenderer />', () => {
  const api = getApi();
  let component;
  let rowNode;
  let value;
  let context;
  let data;

  describe('#render', () => {
    describe('top-level', () => {
      before((done) => {
        rowNode = getNode({field1: 'value'});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(<RowActionsRenderer api={api} value={value}
                                              node={rowNode} context={context}
                                              data={data} nested={false} />);
        done();
      });
      it('renders the edit button', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Edit Document'})).to.be.present();
      });
      it('renders the copy to JSON button', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Copy Document'})).to.be.present();
      });
      it('renders the clone document button', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Clone Document'})).to.be.present();
      });
      it('renders the delete document button', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Delete Document'})).to.be.present();
      });
    });
    describe('nested', () => {
      before((done) => {
        rowNode = getNode({field1: 'value'});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(<RowActionsRenderer api={api} value={value}
                                              node={rowNode} context={context}
                                              data={data} nested={true} />);
        done();
      });
      it('renders the edit button', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Edit Document'})).to.be.present();
      });
      it('does not render other buttons', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Copy row'})).not.to.be.present();
        expect(wrapper.find({title: 'Clone row'})).not.to.be.present();
        expect(wrapper.find({title: 'Delete row'})).not.to.be.present();
      });
    });

    describe('when the distribution is readonly', () => {
      before(() => {
        process.env.HADRON_READONLY = 'true';
        rowNode = getNode({field1: 'value'});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(<RowActionsRenderer api={api} value={value}
                                              node={rowNode} context={context}
                                              data={data} nested={true} />);
      });

      after(() => {
        process.env.HADRON_READONLY = 'false';
      });

      it('does not render the buttons', () => {
        const wrapper = component.find('.table-view-row-actions');
        expect(wrapper.find({title: 'Edit Document'})).not.to.be.present();
        expect(wrapper.find({title: 'Copy row'})).not.to.be.present();
        expect(wrapper.find({title: 'Clone row'})).not.to.be.present();
        expect(wrapper.find({title: 'Delete row'})).not.to.be.present();
      });
    });
  });

  describe('#actions', () => {
    describe('top-level', () => {
      describe('click the edit button', () => {
        before((done) => {
          rowNode = getNode({field1: 'value'});
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(<RowActionsRenderer api={api} value={value}
                                                node={rowNode} context={context}
                                                data={data} nested={false} />);
          const wrapper = component.find({title: 'Edit Document'});
          wrapper.simulate('click');
          done();
        });
        it('calls context.addFooter with editing', () => {
          expect(context.addFooter.callCount).to.equal(1);
          expect(context.addFooter.alwaysCalledWithExactly(
            rowNode, rowNode.data, 'editing')).to.equal(true);
        });
        it('does not call anything else on context', () => {
          notCalledExcept(context, ['addFooter']);
        });
      });
      describe('click the clone document button', () => {
        before((done) => {
          rowNode = getNode({field1: 'value'});
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(<RowActionsRenderer api={api} value={value}
                                                node={rowNode} context={context}
                                                data={data} nested={false} />);
          const wrapper = component.find({title: 'Clone Document'});
          wrapper.simulate('click');
          done();
        });
        it('calls context.handleClone', () => {
          expect(context.handleClone.callCount).to.equal(1);
          expect(context.handleClone.alwaysCalledWithExactly(data)).to.equal(true);
        });
        it('does not call anything else on context', () => {
          notCalledExcept(context, ['handleClone']);
        });
      });
      describe('click the delete document button', () => {
        before((done) => {
          rowNode = getNode({field1: 'value'});
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(<RowActionsRenderer api={api} value={value}
                                                node={rowNode} context={context}
                                                data={data} nested={false} />);
          const wrapper = component.find({title: 'Delete Document'});
          wrapper.simulate('click');
          done();
        });
        it('calls context.addFooter with deleting', () => {
          expect(context.addFooter.callCount).to.equal(1);
          expect(context.addFooter.alwaysCalledWithExactly(
            rowNode, rowNode.data, 'deleting')).to.equal(true);
        });
        it('does not call anything else on context', () => {
          notCalledExcept(context, ['addFooter']);
        });
      });
    });

    describe('nested', () => {
      describe('click edit', () => {
        before((done) => {
          rowNode = getNode({field1: 'value'});
          data = rowNode.data;
          value = rowNode.data.hadronDocument.get('field1');
          context = getContext();
          component = mount(<RowActionsRenderer api={api} value={value}
                                                node={rowNode} context={context}
                                                data={data} nested={true} />);
          const wrapper = component.find({title: 'Edit Document'});
          wrapper.simulate('click');
          done();
        });
        it('calls context.addFooter with editing', () => {
          expect(context.addFooter.callCount).to.equal(1);
          expect(context.addFooter.alwaysCalledWithExactly(
            rowNode, rowNode.data, 'editing')).to.equal(true);
        });
        it('does not call anything else on context', () => {
          notCalledExcept(context, ['addFooter']);
        });
      });
    });
  });
});
