import React from 'react';
import { shallow, mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { Card, CardHeader } from '../card';
import Saving from '../saving';
import Query from '../query';

describe('Saving [Component]', function () {
  const date = new Date();
  const model = {
    _lastExecuted: date,
    serialize: () => {
      return {
        _lastExecuted: date,
        filter: { name: 'test' },
      };
    },
  };

  let actions;

  beforeEach(function () {
    actions = {
      cancelSave: sinon.stub(),
      saveFavorite: sinon.stub(),
    };
  });

  afterEach(function () {
    actions = null;
  });

  describe('#rendering', function () {
    let component;

    afterEach(function () {
      component = null;
    });

    it('does not render the saving component when the model is null', function () {
      component = shallow(<Saving model={null} actions={actions} />);

      const node = component.find('[data-testid="query-history-saving"]');
      expect(node).to.have.length(0);
    });

    it('renders the correct root element', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find('[data-testid="query-history-saving"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type(Card);
    });

    it('renders the header', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(
        '[data-testid="query-history-saving-header"]'
      );

      expect(node).to.have.length(1);
      expect(node).to.have.type(CardHeader);
    });

    it('the header should have two children', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(
        '[data-testid="query-history-saving-header"]'
      );

      expect(node.children()).to.have.length(2);
    });

    it('renders the form', function () {
      component = mount(<Saving model={model} actions={actions} />);

      const node = component.find('[data-testid="query-history-saving-form"]');

      expect(node).to.have.length(1);
      expect(node).to.have.type('form');
    });

    it('the form should have an input', function () {
      component = mount(<Saving model={model} actions={actions} />);

      const node = component.find('[data-testid="query-history-saving-form"]');

      expect(node.children()).to.have.length(1);
      expect(node.childAt(0)).to.have.type('input');
    });

    it('renders the save button', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(
        '[data-testid="query-history-saving-form-button-save"]'
      );

      expect(node).to.have.length(1);
      expect(node).to.have.type('button');
    });

    it('renders the cancel button', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(
        '[data-testid="query-history-saving-form-button-cancel"]'
      );

      expect(node).to.have.length(1);
      expect(node).to.have.type('button');
    });

    it('renders the query component', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(Query);
      expect(node).to.have.length(1);
    });
  });

  describe('#behavior', function () {
    let component;

    it('should save the query as a favorite when the form is submitted', function () {
      component = shallow(<Saving model={model} actions={actions} />);

      const node = component.find(
        '[data-testid="query-history-saving-form-button-save"]'
      );

      node.simulate('click');
      expect(actions.saveFavorite).to.have.been.calledOnce;
    });

    it('should cancel the saving of the query as a favorite when the cancel button is clicked', function () {
      component = shallow(<Saving model={model} actions={actions} />);
      const node = component.find(
        '[data-testid="query-history-saving-form-button-cancel"]'
      );

      node.simulate('click');
      expect(actions.cancelSave).to.have.been.calledOnce;
    });
  });
});
