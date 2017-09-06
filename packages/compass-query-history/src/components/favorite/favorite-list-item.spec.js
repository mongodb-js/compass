import React from 'react';
import { shallow } from 'enzyme';
import { FavoriteListItem } from 'components/favorite';
import Query from 'components/query';
import { Card, CardHeader, CardBody } from 'components/card';

describe('FavoriteListItem [Component]', () => {
  const date = new Date();
  const favorite = {
    getAttributes: () => {
      return {
        _name: 'testing',
        _dateSaved: date,
        filter: { name: 'test' }
      };
    }
  };

  let actions;
  let component;

  beforeEach(() => {
    actions = {
      copyQuery: sinon.stub(),
      deleteFavorite: sinon.stub()
    };

    component = shallow(<FavoriteListItem model={favorite} actions={actions} />);
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

    it('CardHeader should contain two buttons', () => {
      const node = component.find(CardHeader);

      expect(node.children()).to.have.length(2);
      expect(node.childAt(0).type()).to.equal('button');
      expect(node.childAt(1).type()).to.equal('button');
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
    it('should call the copyQuery action when the copy query button is clicked', () => {
      const node = component.find('[data-test-id="query-history-button-copy-query"]');
      node.simulate('click');

      actions.copyQuery.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });

    it('should call the deleteFavorite action when the copy query button is clicked', () => {
      const node = component.find('[data-test-id="query-history-button-delete-fav"]');
      node.simulate('click');

      actions.deleteFavorite.should.have.been.calledOnce; // eslint-disable-line no-unused-expressions
    });
  });
});
