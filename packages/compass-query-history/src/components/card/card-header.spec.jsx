import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { CardHeader } from '../card';
import styles from './card.module.less';

describe('CardHeader [Component]', function () {
  describe('#rendering', function () {
    let component;

    beforeEach(function () {
      component = shallow(
        <CardHeader title="Test" className="foo">
          <span>Child 1</span>
          <span>Child 2</span>
          <span>Child 3</span>
        </CardHeader>
      );
    });

    afterEach(function () {
      component = null;
    });

    it('should be a stateless function', function () {
      expect(CardHeader).to.be.a('function');
    });

    it('renders the correct className on the root node', function () {
      const node = component.find(`.${styles['component-header']}`);
      expect(node).to.have.length(1);
    });

    it('renders the className passed to it', function () {
      const node = component.find('.foo');
      expect(node).to.have.length(1);
    });

    it('renders the correct className on the title node', function () {
      const node = component.find(`.${styles['component-header-title']}`);
      expect(node).to.have.length(1);
    });

    it('renders the correct className on the actions node', function () {
      const node = component.find(`.${styles['component-header-actions']}`);
      expect(node).to.have.length(1);
    });

    it('renders the correct title', function () {
      const node = component.find(`.${styles['component-header-title']}`);
      expect(node).to.have.text('Test');
    });

    it('renders children under the actions node', function () {
      const node = component.find(`.${styles['component-header-actions']}`);
      expect(node.children()).to.have.length(3);
    });
  });
});
