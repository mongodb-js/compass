import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import { FavoriteListItem } from '../favorite';
import Query from '../query';
import { Card, CardHeader, CardBody } from '../card';

describe('FavoriteListItem [Component]', function() {
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

  beforeEach(function() {
    actions = {
      copyQuery: sinon.stub(),
      deleteFavorite: sinon.stub()
    };

    component = shallow(<FavoriteListItem model={favorite} actions={actions} />);
  });

  afterEach(function() {
    actions = null;
    component = null;
  });

  describe('#rendering', function() {
    it('renders a Card component as its root node', function() {
      expect(component.type()).to.equal(Card);
    });

    it('renders a CardHeader', function() {
      const node = component.find(CardHeader);
      expect(node).to.have.length(1);
    });

    it('CardHeader should contain two buttons', function() {
      const node = component.find(CardHeader);

      expect(node.children()).to.have.length(2);
      expect(node.childAt(0).type()).to.equal('button');
      expect(node.childAt(1).type()).to.equal('button');
    });

    it('renders a CardBody', function() {
      const node = component.find(CardBody);
      expect(node).to.have.length(1);
    });

    it('CardBody should contain a Query component', function() {
      const node = component.find(CardBody);

      expect(node.children()).to.have.length(1);
      expect(node.childAt(0).type()).to.equal(Query);
    });

    it('filters out _ prefixed attributes from the query component', function() {
      const node = component.find(Query);
      const queryAttributes = node.prop('attributes');

      expect(queryAttributes['_name']).to.equal(undefined);
      expect(queryAttributes['_dateSaved']).to.equal(undefined);
    });
  });

  describe('#behavior', function() {
    it('should call the copyQuery action when the copy query button is clicked', function() {
      const node = component.find('[data-test-id="query-history-button-copy-query"]');
      node.simulate('click');

      expect(actions.copyQuery).to.have.been.calledOnce;
    });

    it('should call the deleteFavorite action when the copy query button is clicked', function() {
      const node = component.find('[data-test-id="query-history-button-delete-fav"]');
      node.simulate('click');

      expect(actions.deleteFavorite).to.have.been.calledOnce;
    });
  });
});
