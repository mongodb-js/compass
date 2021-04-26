import React from 'react';
import { shallow } from 'enzyme';
import { RecentListItem } from 'components/recent';
import Query from 'components/query';
import { Card, CardHeader, CardBody } from 'components/card';

describe('RecentListItem [Component]', () => {
  const date = new Date();
  const recent = {
    _lastExecuted: date,
    getAttributes: () => {
      return {
        _lastExecuted: date,
        filter: { name: 'test' }
      };
    }
  };

  let actions;
  let component;

  beforeEach(() => {
    actions = {
      saveRecent: sinon.stub(),
      copyQuery: sinon.stub(),
      deleteRecent: sinon.stub()
    };

    component = shallow(<RecentListItem model={recent} actions={actions} />);
  });

  afterEach(() => {
    actions = null;
    component = null;
  });

  describe('#rendering', () => {
    it('renders a Card component as its root node', () => {
      expect(component.type()).to.equal(Card);
    });

    it('renders a CardHeader', () => {
      const node = component.find(CardHeader);
      expect(node).to.have.length(1);
    });

    it('CardHeader should contain three buttons', () => {
      const node = component.find(CardHeader);

      expect(node.children()).to.have.length(3);
      expect(node.childAt(0).type()).to.equal('button');
      expect(node.childAt(1).type()).to.equal('button');
      expect(node.childAt(2).type()).to.equal('button');
    });

    it('renders a CardBody', () => {
      const node = component.find(CardBody);
      expect(node).to.have.length(1);
    });

    it('CardBody should contain a Query component', () => {
      const node = component.find(CardBody);

      expect(node.children()).to.have.length(1);
      expect(node.childAt(0).type()).to.equal(Query);
    });

    it('filters out _ prefixed attributes from the query component', () => {
      const node = component.find(Query);
      const queryAttributes = node.prop('attributes');

      expect(queryAttributes.hasOwnProperty('_name')).to.equal(false);
      expect(queryAttributes.hasOwnProperty('_dateSaved')).to.equal(false);
    });
  });

  describe('#behavior', () => {
    it('should call the saveRecent action when the favorite query button is clicked', () => {
      const node = component.find('[data-test-id="query-history-button-fav"]');
      node.simulate('click');

      actions.saveRecent.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });

    it('should call the copyQuery action when the copy query button is clicked', () => {
      const node = component.find('[data-test-id="query-history-button-copy-query"]');
      node.simulate('click');

      actions.copyQuery.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });

    it('should call the deleteRecent action when the copy query button is clicked', () => {
      const node = component.find('[data-test-id="query-history-button-delete-recent"]');
      node.simulate('click');

      actions.deleteRecent.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });
  });
});
