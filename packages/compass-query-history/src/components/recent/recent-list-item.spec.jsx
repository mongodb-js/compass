import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { RecentListItem } from '../recent';
import Query from '../query';
import { Card, CardHeader, CardBody } from '../card';

describe('RecentListItem [Component]', function () {
  const date = new Date();
  const recent = {
    _lastExecuted: date,
    getAttributes: () => {
      return {
        _lastExecuted: date,
        filter: { name: 'test' },
      };
    },
  };

  let actions;
  let component;

  beforeEach(function () {
    actions = {
      saveRecent: sinon.stub(),
      copyQuery: sinon.stub(),
      deleteRecent: sinon.stub(),
    };

    component = shallow(<RecentListItem model={recent} actions={actions} />);
  });

  afterEach(function () {
    actions = null;
    component = null;
  });

  describe('#rendering', function () {
    it('renders a Card component as its root node', function () {
      expect(component.type()).to.equal(Card);
    });

    it('renders a CardHeader', function () {
      const node = component.find(CardHeader);
      expect(node).to.have.length(1);
    });

    it('CardHeader should contain three buttons', function () {
      const node = component.find(CardHeader);

      expect(node.children()).to.have.length(3);
      expect(node.childAt(0).type()).to.equal('button');
      expect(node.childAt(1).type()).to.equal('button');
      expect(node.childAt(2).type()).to.equal('button');
    });

    it('renders a CardBody', function () {
      const node = component.find(CardBody);
      expect(node).to.have.length(1);
    });

    it('CardBody should contain a Query component', function () {
      const node = component.find(CardBody);

      expect(node.children()).to.have.length(1);
      expect(node.childAt(0).type()).to.equal(Query);
    });

    it('filters out _ prefixed attributes from the query component', function () {
      const node = component.find(Query);
      const queryAttributes = node.prop('attributes');

      expect(queryAttributes).to.not.have.property('_name');
      expect(queryAttributes).to.not.have.property('_dateSaved');
    });
  });

  describe('#behavior', function () {
    it('should call the saveRecent action when the favorite query button is clicked', function () {
      const node = component.find('[data-test-id="query-history-button-fav"]');
      node.simulate('click');

      expect(actions.saveRecent).to.have.been.calledOnce;
    });

    it('should call the copyQuery action when the copy query button is clicked', function () {
      const node = component.find(
        '[data-test-id="query-history-button-copy-query"]'
      );
      node.simulate('click');

      expect(actions.copyQuery).to.have.been.calledOnce;
    });

    it('should call the deleteRecent action when the copy query button is clicked', function () {
      const node = component.find(
        '[data-test-id="query-history-button-delete-recent"]'
      );
      node.simulate('click');

      expect(actions.deleteRecent).to.have.been.calledOnce;
    });
  });
});
