import React from 'react';
import { shallow, mount } from 'enzyme';

import { Card, CardHeader } from 'components/card';
import Saving from 'components/saving';
import Query from 'components/query';

describe('Saving [Component]', () => {
  const date = new Date();
  const model = {
    _lastExecuted: date,
    serialize: () => {
      return {
        _lastExecuted: date,
        filter: { name: 'test' }
      };
    }
  };

  let actions;

  beforeEach(() => {
    actions = {
      cancelSave: sinon.stub(),
      saveFavorite: sinon.stub()
    };
  });

  afterEach(() => {
    actions = null;
  });

  describe('#rendering', () => {
    let component;

    afterEach(() => {
      component = null;
    });

    it('does not render the saving component when the model is null', () => {
      component = shallow(<Saving model={null} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving"]');
      expect(node).to.have.length(0);
    });

    it('renders the correct root element', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type(Card);
    });

    it('renders the header', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-header"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type(CardHeader);
    });

    it('the header should have two children', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-header"]');

      expect(node.children()).to.have.length(2);
    });

    it('renders the form', () => {
      component = mount(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-form"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type('form');
    });

    it('the form should have an input', () => {
      component = mount(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-form"]');

      expect(node.children()).to.have.length(1);
      expect(node.childAt(0)).to.have.type('input');
    });

    it('renders the save button', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-form-button-save"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type('button');
    });

    it('renders the cancel button', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-form-button-cancel"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type('button');
    });

    it('renders the query component', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(Query);
      expect(node).to.have.length(1);
    });
  });

  describe('#behavior', () => {
    let component;

    it('should save the query as a favorite when the form is submitted', () => {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-test-id="query-history-saving-form-button-save"]');

      node.simulate('click');
      actions.saveFavorite.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });

    it('should cancel the saving of the query as a favorite when the cancel button is clicked', () => {
      component = shallow(<Saving model={model} actions={actions} />);
      const node = component.find('[data-test-id="query-history-saving-form-button-cancel"]');

      node.simulate('click');
      actions.cancelSave.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });
  });
});
