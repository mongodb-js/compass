/*
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
});
*/
